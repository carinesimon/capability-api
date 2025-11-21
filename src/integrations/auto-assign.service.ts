import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AssignRule = {
  role: 'SETTER' | 'CLOSER';
  by: 'email' | 'name' | 'static';
  from?: string; // chemin dans le payload
  match?: {
    equals?: string;
    contains?: string;
    regex?: string;
  };
  userId?: string; // pour 'static'
};

type ApplyArgs = {
  leadId: string;
  automation: {
    id: string;
    status: 'OFF' | 'DRY_RUN' | 'ON';
    mappingJson?: any;
    metaJson?: any;
  };
  payload: any;
  dryRun?: boolean;
};

type ApplyResult = {
  matchedRuleIndex?: number;
  matchedRule?: AssignRule;
  assignedSetterId?: string | null;
  assignedCloserId?: string | null;
  usedRoundRobin?: boolean;
  roundRobinNextId?: string | null;
  skippedBecauseAlreadyAssigned?: boolean;
  notes?: string[];
};

@Injectable()
export class AutoAssignService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------- utils -------------------- */
  private getByPath(obj: any, path?: string) {
    if (!path) return undefined;
    try {
      return path.split('.').reduce((acc: any, k: string) => (acc != null ? acc[k] : undefined), obj);
    } catch {
      return undefined;
    }
  }

  private async findUserByEmail(email: string, role: Role) {
    if (!email) return null;
    const u = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, role, isActive: true },
      select: { id: true },
    });
    return u;
    
  }

  private async findUserByName(name: string, role: Role) {
    if (!name) return null;
    const token = String(name).trim();
    if (!token) return null;
    const u = await this.prisma.user.findFirst({
      where: {
        role, isActive: true,
        OR: [
          { firstName: { contains: token, mode: 'insensitive' } },
          { lastName: { contains: token, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ firstName: 'asc' as const }],
      select: { id: true },
    });
    return u;
  }

  private async nextSetterRoundRobin(prevId?: string | null) {
    const setters = await this.prisma.user.findMany({
      where: { role: Role.SETTER, isActive: true },
      orderBy: [{ firstName: 'asc' }],
      select: { id: true },
    });
    if (!setters.length) return null;
    if (!prevId) return setters[0];
    const idx = setters.findIndex((u) => u.id === prevId);
    const nextIdx = idx >= 0 ? (idx + 1) % setters.length : 0;
    return setters[nextIdx];
  }

  private matchesRuleValue(sourceVal: any, match?: AssignRule['match']) {
    if (!match) return true; // si pas de contrainte, considéré comme ok
    const s = String(sourceVal ?? '');
    if (match.equals != null) return s === match.equals;
    if (match.contains != null) return s.toLowerCase().includes(String(match.contains).toLowerCase());
    if (match.regex) {
      try {
        const m = match.regex.startsWith('/') && match.regex.lastIndexOf('/') > 0
          ? match.regex.slice(1, match.regex.lastIndexOf('/'))
          : match.regex;
        const flags = /\/([gimsuy]*)$/.exec(match.regex)?.[1] ?? 'i';
        const re = new RegExp(m, flags);
        return re.test(s);
      } catch { return false; }
    }
    return false;
  }

  /* -------------------- cœur : application -------------------- */
  async apply(args: ApplyArgs): Promise<ApplyResult> {
    const { automation, payload, dryRun } = args;
    const notes: string[] = [];
    const result: ApplyResult = { notes };

    // Sécurité : charge l’état actuel du lead pour savoir si on doit écraser ou non
    const lead = await this.prisma.lead.findUnique({
      where: { id: args.leadId },
      select: { id: true, setterId: true, closerId: true },
    });
    if (!lead) {
      notes.push('Lead introuvable.');
      return result;
    }

    const cfg = automation?.mappingJson?.assign ?? {};
    const overwrite = Boolean(cfg?.overwrite ?? false); // par défaut: on n’écrase pas
    const roundRobinEnabled = Boolean(cfg?.roundRobin?.setter ?? true);
    const rules: AssignRule[] = Array.isArray(cfg?.rules) ? cfg.rules : [];

    // 1) Évalue les règles dans l’ordre
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const role = r.role === 'CLOSER' ? Role.CLOSER : Role.SETTER;

      if (r.by === 'email') {
        const v = this.getByPath(payload, r.from);
        if (v == null) continue;
        const user = await this.findUserByEmail(String(v), role);
        if (!user) continue;

        result.matchedRuleIndex = i; result.matchedRule = r;
        if (role === Role.SETTER) result.assignedSetterId = user.id;
        else result.assignedCloserId = user.id;
        notes.push(`Règle #${i + 1} (email→${role}) a matché: ${v}`);
        break;
      }

      if (r.by === 'name') {
        const v = this.getByPath(payload, r.from);
        if (v == null) continue;
        const user = await this.findUserByName(String(v), role);
        if (!user) continue;

        result.matchedRuleIndex = i; result.matchedRule = r;
        if (role === Role.SETTER) result.assignedSetterId = user.id;
        else result.assignedCloserId = user.id;
        notes.push(`Règle #${i + 1} (name→${role}) a matché: ${v}`);
        break;
      }

      if (r.by === 'static') {
        const src = this.getByPath(payload, r.from);
        if (!this.matchesRuleValue(src, r.match)) continue;
        if (!r.userId) continue;

        // vérifie que l’utilisateur existe & actif & de bon rôle
        const user = await this.prisma.user.findFirst({
          where: { id: r.userId, role, isActive: true },
          select: { id: true },
        });
        if (!user) continue;

        result.matchedRuleIndex = i; result.matchedRule = r;
        if (role === Role.SETTER) result.assignedSetterId = user.id;
        else result.assignedCloserId = user.id;
        notes.push(`Règle #${i + 1} (static→${role}) a matché.`);
        break;
      }
    }

    // 2) Fallback round-robin SETTER si aucune règle appliquée pour le setter
    if (!result.assignedSetterId && roundRobinEnabled) {
      const prev = automation?.metaJson?.roundRobin?.lastSetterId ?? null;
      const next = await this.nextSetterRoundRobin(prev);
      if (next) {
        result.assignedSetterId = next.id;
        result.usedRoundRobin = true;
        result.roundRobinNextId = next.id;
        notes.push(`Round-robin SETTER → ${next.id}`);
      } else {
        notes.push('Round-robin SETTER impossible (aucun setter actif).');
      }
    }

    // 3) Applique en base (sauf dry-run)
const patch: Prisma.LeadUpdateInput = {};
    const shouldSetSetter =
      result.assignedSetterId &&
      (overwrite || !lead.setterId || lead.setterId === result.assignedSetterId);
    const shouldSetCloser =
      result.assignedCloserId &&
      (overwrite || !lead.closerId || lead.closerId === result.assignedCloserId);

    if (!overwrite && (lead.setterId || lead.closerId)) {
      result.skippedBecauseAlreadyAssigned = true;
      notes.push('Assignation ignorée (overwrite=false et lead déjà assigné).');
    }

    if (shouldSetSetter) {
  patch.setter = { connect: { id: result.assignedSetterId! } };
}
    if (shouldSetCloser) {
  patch.closer = { connect: { id: result.assignedCloserId! } };
}

    if (!dryRun && (shouldSetSetter || shouldSetCloser)) {
      await this.prisma.lead.update({ where: { id: lead.id }, data: patch });
      notes.push('Lead mis à jour (assignation appliquée).');
    } else if (dryRun) {
      notes.push('Dry-run: aucune écriture en base.');
    }

    // 4) Persiste l’état round-robin si utilisé et pas en dry-run
    if (!dryRun && result.usedRoundRobin && result.roundRobinNextId) {
      const nextMeta = {
        ...(automation.metaJson || {}),
        roundRobin: { ...(automation.metaJson?.roundRobin || {}), lastSetterId: result.roundRobinNextId },
      };
      await this.prisma.automation.update({
        where: { id: automation.id },
        data: { metaJson: nextMeta as any },
      });
      notes.push('Round-robin checkpoint (automation.metaJson) enregistré.');
    }

    return result;
  }
}

