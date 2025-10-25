import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import { LeadStage } from '@prisma/client';

type InboxItem = {
  id: string;
  receivedAt: string;
  contentType: string;
  headers: any;
  query: any;
  raw: string;
  parsed: any; // objet "deviné"
  hash: string;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const DATA_DIR = path.resolve(process.cwd(), '.data', 'webhooks');

function safeJsonParse(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

/** Parse heuristique */
function smartParse(raw: string, contentType: string): any {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('application/json')) {
    const j = safeJsonParse(raw);
    if (j) return j;
  }
  if (ct.includes('application/x-www-form-urlencoded') || raw.includes('=')) {
    const obj = qs.parse(raw);
    const flattened: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k.replace(/\]/g, '').replace(/\[/g, '.');
      flattened[key] = Array.isArray(v) ? v[0] : v;
    }
    return flattened;
  }
  return safeJsonParse(raw) ?? { text: raw };
}

/** Accès profond par chemin 'a.b.c' */
function getByPath(obj: any, p?: string): any {
  if (!obj || !p) return undefined;
  return p.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

/** Mapping colonne GHL -> LeadStage (nouveau) */
function mapStageNameToLeadStage(name?: string): LeadStage | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase().trim();
  if (['prospect', 'prospects', 'nouveau', 'new'].some(x => n.includes(x))) return 'LEADS_RECEIVED';
  if (n.includes('rv0')) return 'RV0_PLANNED';
  if (n.includes('rv1')) return 'RV1_PLANNED';
  if (n.includes('rv2') || n.includes('follow')) return 'RV2_PLANNED';
  if (n.includes('won') || n.includes('gagn')) return 'WON';
  if (n.includes('lost') || n.includes('perdu')) return 'LOST';
  if (n.includes('not') && n.includes('qual')) return 'NOT_QUALIFIED';
  return undefined;
}

@Injectable()
export class GhlService {
  constructor(private prisma: PrismaService) {}

  /** Idempotence simple */
  async deduplicate(eventId?: string) {
    if (!eventId) return;
    await this.prisma.webhookEvent.upsert({
      where: { externalId: eventId },
      update: { status: 'RECEIVED', receivedAt: new Date(), type: 'ghl', payloadHash: eventId },
      create: { externalId: eventId, status: 'RECEIVED', receivedAt: new Date(), type: 'ghl', payloadHash: eventId },
    });
  }

  async upsertContact(args: {
    firstName?: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    tag?: string | null;
    sourceTag?: string | null;
    ghlContactId?: string | null;
  }) {
    return this.upsertLead({
      ghlContactId: args.ghlContactId || undefined,
      firstName: args.firstName || 'Unknown',
      lastName: args.lastName ?? null,
      email: args.email ?? null,
      phone: args.phone ?? null,
      source: 'GHL',
      tag: args.tag ?? args.sourceTag ?? null,
    });
  }

  async upsertOpportunity(args: {
    contactEmail?: string | null;
    ghlContactId?: string | null;
    amount?: number | null;
    stage?: string | null;
    saleValue?: number | null;
  }) {
    const lead =
      (args.ghlContactId
        ? await this.prisma.lead.findFirst({ where: { ghlContactId: args.ghlContactId } })
        : null) ||
      (args.contactEmail
        ? await this.prisma.lead.findFirst({ where: { email: (args.contactEmail || '').toLowerCase() } })
        : null);

    const mapped = mapStageNameToLeadStage(args.stage || undefined);
    if (!lead) {
      return this.prisma.lead.create({
        data: {
          firstName: 'Unknown',
          lastName: null,
          email: args.contactEmail?.toLowerCase() || null,
          source: 'GHL',
          ghlContactId: args.ghlContactId ?? null,
          ...(mapped ? { stage: mapped, stageUpdatedAt: new Date() } : {}),
          ...(mapped === 'WON' && args.saleValue != null ? { saleValue: args.saleValue! } : {}),
        },
      });
    }

    const update: any = {};
    if (mapped) {
      update.stage = mapped;
      update.stageUpdatedAt = new Date();
      if (mapped === 'WON' && args.saleValue != null) update.saleValue = args.saleValue!;
    }
    if (args.ghlContactId && !lead.ghlContactId) update.ghlContactId = args.ghlContactId;

    if (Object.keys(update).length === 0) return lead;
    return this.prisma.lead.update({ where: { id: lead.id }, data: update });
  }

  async upsertAppointment(args: {
    id?: string | null;
    type?: string | null;      // RV0/RV1/RV2
    status?: string | null;    // HONORED/NO_SHOW/...
    startTime?: string | null; // ISO
    contactEmail?: string | null;
    ghlContactId?: string | null;
    ownerEmail?: string | null;
  }) {
    const lead =
      (args.ghlContactId
        ? await this.prisma.lead.findFirst({ where: { ghlContactId: args.ghlContactId } })
        : null) ||
      (args.contactEmail
        ? await this.prisma.lead.findFirst({ where: { email: (args.contactEmail || '').toLowerCase() } })
        : null);

    const leadId = lead?.id ?? null;

    const user =
      args.ownerEmail
        ? await this.prisma.user.findFirst({ where: { email: args.ownerEmail.toLowerCase() } })
        : null;

    try {
      const scheduledAt = args.startTime ? new Date(args.startTime) : new Date();
      const type = (args.type || '').toUpperCase() as any;
      const status = (args.status || '').toUpperCase() as any;

      if (args.id) {
        return await (this.prisma as any).appointment.upsert({
          where: { id: args.id },
          update: {
            type, status, scheduledAt,
            ...(leadId ? { leadId } : {}),
            ...(user?.id ? { userId: user.id } : {}),
          },
          create: {
            id: args.id,
            type, status, scheduledAt,
            ...(leadId ? { leadId } : {}),
            ...(user?.id ? { userId: user.id } : {}),
          },
        });
      } else {
        return await (this.prisma as any).appointment.create({
          data: {
            type, status, scheduledAt,
            ...(leadId ? { leadId } : {}),
            ...(user?.id ? { userId: user.id } : {}),
          },
        });
      }
    } catch {
      return { ok: true };
    }
  }

  /** ------------- Inbox fichiers + auto-process ------------- */

  async captureInbox(args: { raw: string; headers: any; query: any; contentType: string }): Promise<InboxItem> {
    ensureDir(DATA_DIR);
    const id = crypto.randomUUID();
    const hash = crypto.createHash('sha256').update(args.raw || '').digest('hex');
    const parsed = smartParse(args.raw || '', args.contentType || '');

    const item: InboxItem = {
      id,
      receivedAt: new Date().toISOString(),
      contentType: args.contentType || '',
      headers: args.headers || {},
      query: args.query || {},
      raw: args.raw || '',
      parsed,
      hash,
    };

    const file = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(item, null, 2), 'utf8');

    await this.prisma.webhookEvent.upsert({
      where: { externalId: hash },
      update: { status: 'RECEIVED', payloadHash: hash, type: 'ghl', receivedAt: new Date() },
      create: {
        externalId: hash,
        status: 'RECEIVED',
        payloadHash: hash,
        type: 'ghl',
        receivedAt: new Date(),
      },
    });

    return item;
  }

  async listInbox(limit = 50) {
    ensureDir(DATA_DIR);
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort().reverse();
    const out: Array<Pick<InboxItem, 'id'|'receivedAt'|'contentType'>> = [];
    for (const f of files.slice(0, limit)) {
      const j = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
      out.push({ id: j.id, receivedAt: j.receivedAt, contentType: j.contentType });
    }
    return { ok: true, items: out };
  }

  async getInboxItem(id: string): Promise<InboxItem> {
    const file = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(file)) throw new Error('Inbox item not found');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  async tryAutoProcess(item: InboxItem) {
    const p = item.parsed || {};
    const firstName = p['contact.first_name'] ?? p['first_name'] ?? p['firstName'] ?? p['contact.name']?.split(' ')?.[0];
    const lastName  = p['contact.last_name']  ?? p['last_name']  ?? p['lastName']  ?? (p['contact.name']?.split(' ')?.slice(1).join(' ') || null);
    const email     = p['contact.email']      ?? p['email']      ?? null;
    const phone     = p['contact.phone']      ?? p['phone']      ?? null;

    const stageName = p['opportunity.stage_name'] ?? p['stage_name'] ?? p['stageName'] ?? undefined;
    const saleValue = Number(p['opportunity.monetary_value'] ?? p['monetary_value'] ?? p['saleValue'] ?? NaN);
    const ghlContactId = p['contact.id'] ?? p['contactId'] ?? p['id'] ?? undefined;

    if (!firstName && !email && !phone) return;

    await this.upsertLead({
      ghlContactId,
      firstName: firstName || 'Unknown',
      lastName: lastName || null,
      email: email || null,
      phone: phone || null,
      source: 'GHL',
      tag: null,
      stageName,
      saleValue: Number.isFinite(saleValue) ? saleValue : undefined,
      createdAtISO: undefined,
    });
  }

  async processWithMapping(inboxId: string, mapping: Record<string, string>, defaults: Record<string, any> = {}) {
    const item = await this.getInboxItem(inboxId);
    const p = item.parsed || {};
    const pick = (k?: string) => (k ? getByPath(p, k) : undefined);

    const payload = {
      ghlContactId: String(pick(mapping['ghlContactId']) ?? p['contact.id'] ?? p['contactId'] ?? ''),
      firstName: (pick(mapping['firstName']) ?? defaults.firstName ?? 'Unknown') as string,
      lastName: (pick(mapping['lastName']) ?? defaults.lastName ?? null) as string | null,
      email: (pick(mapping['email']) ?? defaults.email ?? null) as string | null,
      phone: (pick(mapping['phone']) ?? defaults.phone ?? null) as string | null,
      source: (pick(mapping['source']) ?? defaults.source ?? 'GHL') as string | null,
      tag: (pick(mapping['tag']) ?? defaults.tag ?? null) as string | null,
      stageName: (pick(mapping['stageName']) ?? defaults.stageName ?? undefined) as string | undefined,
      saleValue: Number(pick(mapping['saleValue']) ?? defaults.saleValue ?? NaN),
      createdAtISO: (pick(mapping['createdAt']) ?? undefined) as string | undefined,
    };

    if (!Number.isFinite(payload.saleValue)) delete (payload as any).saleValue;

    const lead = await this.upsertLead(payload as any);
    return { ok: true, lead };
  }

  private async upsertLead(args: {
    ghlContactId?: string;
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    tag?: string | null;
    stageName?: string;
    saleValue?: number;
    createdAtISO?: string;
  }) {
    const whereOr: any[] = [];
    if (args.ghlContactId) whereOr.push({ ghlContactId: args.ghlContactId });
    if (args.email) whereOr.push({ email: (args.email || '').toLowerCase() });
    if (args.phone) whereOr.push({ phone: args.phone });

    let existing: any = null;
    if (whereOr.length) {
      existing = await this.prisma.lead.findFirst({ where: { OR: whereOr } as any });
    }

    const stage = mapStageNameToLeadStage(args.stageName);
    const baseData: any = {
      firstName: args.firstName || 'Unknown',
      lastName: args.lastName ?? null,
      email: args.email ? args.email.toLowerCase() : null,
      phone: args.phone ?? null,
      source: args.source ?? 'GHL',
      tag: args.tag ?? null,
      ghlContactId: args.ghlContactId ?? null,
    };

    let lead;
    if (!existing) {
      lead = await this.prisma.lead.create({
        data: {
          ...baseData,
          ...(args.createdAtISO ? { createdAt: new Date(args.createdAtISO) } : {}),
          ...(stage ? { stage, stageUpdatedAt: new Date() } : {}),
          ...(args.saleValue != null && stage === 'WON' ? { saleValue: args.saleValue } : {}),
        },
      });
    } else {
      const update: any = { ...baseData };
      if (stage) { update.stage = stage; update.stageUpdatedAt = new Date(); }
      if (args.saleValue != null && stage === 'WON') update.saleValue = args.saleValue;

      lead = await this.prisma.lead.update({
        where: { id: existing.id },
        data: update,
      });
    }
    return lead;
  }
}
