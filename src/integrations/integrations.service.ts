// src/integrations/integrations.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationStatus, LeadStage, Role, Prisma } from '@prisma/client';
import { AutoAssignService } from './auto-assign.service';
import { StageEventsService } from '../modules/leads/stage-events.service';

// ------- utils -------
function getByPath(obj: any, path?: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
}

function baseUrl(): string {
  const raw = (process.env.PUBLIC_BASE_URL || '').trim();
  if (!raw) return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function routeKey(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
  
}

function makeAbsoluteWebhookUrl(routeKeyStr: string) {
  const b = baseUrl();
  return b ? `${b}/hook/${routeKeyStr}` : `/hook/${routeKeyStr}`;
}

// --- Gate: refuse de créer si aucun identifiant utile n'est mappé
function mappingGateReason(mapped: any): string | null {
  const safeEmail =
    mapped.email && String(mapped.email).includes('@')
      ? String(mapped.email).toLowerCase()
      : null;

  const hasIdentifier = Boolean(safeEmail || mapped?.phone || mapped?.ghlContactId);

  if (!hasIdentifier) {
    return 'mapping_incomplete_no_identifier'; // pas d'email/phone/ghlContactId → on ignore
  }
  return null;
}

// normalisation (compat ancienne orthographe)
const LEGACY_TO_NEW: Record<string, LeadStage> = {
  LEAD_RECU: 'LEADS_RECEIVED',
  DEMANDE_APPEL: 'CALL_REQUESTED',
  APPEL_PASSE: 'CALL_ATTEMPT',
  APPEL_REPONDU: 'CALL_ANSWERED',
  NO_SHOW_SETTER: 'SETTER_NO_SHOW',
  FOLLOW_UP: 'FOLLOW_UP',

  RV0_PLANIFIE: 'RV0_PLANNED',
  RV0_HONORE: 'RV0_HONORED',
  RV0_NO_SHOW: 'RV0_NO_SHOW',

  RV1_PLANIFIE: 'RV1_PLANNED',
  RV1_HONORE: 'RV1_HONORED',
  RV1_NO_SHOW: 'RV1_NO_SHOW',

  RV2_PLANIFIE: 'RV2_PLANNED',
  RV2_HONORE: 'RV2_HONORED',

  WON: 'WON',
  LOST: 'LOST',
  NOT_QUALIFIED: 'NOT_QUALIFIED',
} as const;

function toEnumStage(val: any): LeadStage | undefined {
  if (!val) return undefined;
  const raw = String(val).trim().toUpperCase();
  if (raw in LEGACY_TO_NEW) return LEGACY_TO_NEW[raw];
  const all = Object.values(LeadStage) as string[];
  return all.includes(raw) ? (raw as LeadStage) : undefined;
}

type ReplayOptions = { mode?: 'upsert' | 'createNew' };

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private readonly autoAssign: AutoAssignService,
    private readonly stageEvents: StageEventsService, // 👈 pour enregistrer les entrées de stage
  ) {}

  // ========= CRUD Automations (attendus par le controller) =========
  async createAutomation(name: string) {
    const rk = routeKey();
    const a = await this.prisma.automation.create({
      data: {
        name,
        routeKey: rk,
        status: AutomationStatus.DRY_RUN,
        // mapping par défaut
        mappingJson: {
          fields: {
            firstName: { from: 'contact.firstName' },
            lastName: { from: 'contact.lastName' },
            email: { from: 'contact.email' },
            phone: { from: 'contact.phone' },
            tag: { from: 'contact.tag' },
            source: { const: 'GHL' },
            ghlContactId: { from: 'contact.id' },
            opportunityValue: { from: 'opportunity.monetaryValue' },
          },
          stage: {
            mode: 'table',
            table: {
              from: 'opportunity.stage',
              map: {},
              fallback: 'LEADS_RECEIVED',
            },
          },
        },
      },
    });
    return this.decorateAutomationAbsolute(a.id);
  }

  async listAutomationsWithAbsoluteUrl() {
    const rows = await this.prisma.automation.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        routeKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((r) => ({
      ...r,
      webhookUrl: makeAbsoluteWebhookUrl(r.routeKey),
    }));
  }

  async getAutomation(id: string) {
    const a = await this.prisma.automation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Automation not found');
    return a;
  }

  async decorateAutomationAbsolute(id: string) {
    const a = await this.getAutomation(id);
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      webhookUrl: makeAbsoluteWebhookUrl(a.routeKey),
      mappingJson: a.mappingJson,
      updatedAt: a.updatedAt,
    };
  }

  async getAutomationWithAbsoluteUrl(id: string) {
    return this.decorateAutomationAbsolute(id);
  }

  async updateAutomation(
    id: string,
    body: { name?: string; status?: 'OFF' | 'DRY_RUN' | 'ON'; mappingJson?: any },
  ) {
    const data: Prisma.AutomationUpdateInput = {
      ...(body.name ? { name: body.name } : {}),
      ...(body.status ? { status: body.status as any } : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'mappingJson')
        ? {
            mappingJson: (body.mappingJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          }
        : {}),
    };
    const a = await this.prisma.automation.update({ where: { id }, data });
    return { ok: true, id: a.id };
  }

  async deleteAutomation(id: string) {
    await this.prisma.automation.delete({ where: { id } });
  }

  async duplicateAutomation(id: string) {
    const a = await this.getAutomation(id);
    const rk = routeKey();
    const b = await this.prisma.automation.create({
      data: {
        name: `${a.name} (copy)`,
        routeKey: rk,
        status: a.status,
        mappingJson: a.mappingJson as any,
        rulesJson: a.rulesJson as any,
      },
    });
    return this.decorateAutomationAbsolute(b.id);
  }

  // ========= Events Inbox =========
  async listEvents(automationId: string, limit: number) {
    return this.prisma.automationEvent.findMany({
      where: { automationId },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        receivedAt: true,
        status: true,
        error: true,
        result: true,
        payload: true,
      },
    });
  }

  // ========= Replay d’un event =========
  async replayEvent(eventId: string, opts?: ReplayOptions) {
    const mode: 'upsert' | 'createNew' = opts?.mode || 'upsert';
    const ev = await this.prisma.automationEvent.findUnique({
      where: { id: eventId },
      include: { automation: true },
    });
    if (!ev) throw new NotFoundException('Event not found');

    const auto = ev.automation!;
    const { mapped, stage, report } = this.applyMapping(
      auto.mappingJson as any,
      ev.payload,
    );

    // --- HARD GATE anti "Unknown" ---
    const gate = mappingGateReason(mapped);
    if (gate) {
      await this.prisma.automationEvent.update({
        where: { id: ev.id },
        data: {
          status: 'PROCESSED',
          result: {
            ignored: true,
            reason: gate,
            preview: mapped,
            stage,
            report,
            replay: true,
            dryRun: auto.status !== AutomationStatus.ON,
          },
          processedAt: new Date(),
        },
      });
      return { ok: true, ignored: true, reason: gate };
    }

    // DRY RUN → pas de persistance
    if (auto.status !== AutomationStatus.ON) {
      await this.prisma.automationEvent.update({
        where: { id: ev.id },
        data: {
          status: 'PROCESSED',
          result: {
            preview: mapped,
            stage,
            report,
            replay: true,
            dryRun: true,
            mode,
          },
          processedAt: new Date(),
        },
      });
      return { ok: true, leadId: null, dryRun: true, mode };
    }

    // ON → persistance
    const safeEmail =
      mapped.email && String(mapped.email).includes('@')
        ? String(mapped.email).toLowerCase()
        : null;

    let existing: any = null;
    if (mode !== 'createNew') {
      if (safeEmail) {
        existing = await this.prisma.lead
          .findUnique({ where: { email: safeEmail } })
          .catch(() => null);
      }
      if (!existing && mapped.ghlContactId) {
        existing = await this.prisma.lead
          .findUnique({ where: { ghlContactId: String(mapped.ghlContactId) } })
          .catch(() => null);
      }
    }

    let leadId: string;
    let createdNow = false;

    if (existing) {
      const updated = await this.prisma.lead.update({
        where: { id: existing.id },
        data: this.buildUpdate(mapped),
      });
      leadId = updated.id;
    } else {
      try {
        const created = await this.prisma.lead.create({
          data: this.buildCreate(mapped, stage),
        });
        leadId = created.id;
        createdNow = true;
      } catch (e: any) {
        if (
          mode === 'createNew' &&
          e?.code === 'P2002' &&
          e?.meta?.target?.includes?.('email')
        ) {
          const created = await this.prisma.lead.create({
            data: { ...this.buildCreate(mapped, stage), email: null },
          });
          leadId = created.id;
          createdNow = true;
        } else {
          throw e;
        }
      }
    }

    // setter/closer éventuels
    await this.connectActorsIfAny(leadId, mapped);

    // === AUTO-ASSIGN ===
    await this.autoAssign.apply({
      leadId,
      automation: {
        id: auto.id,
        status: auto.status,
        mappingJson: auto.mappingJson as any,
        metaJson: (auto as any).metaJson,
      },
      payload: ev.payload,
      dryRun: false,
    });

    // === ICI on enregistre vraiment l'entrée de stage ===
    if (stage) {
      const prevStage =
        existing?.stage ??
        (createdNow ? 'LEADS_RECEIVED' : 'LEADS_RECEIVED');

      // event-sourcing
      await this.stageEvents.recordStageEntry({
        leadId,
        fromStage: prevStage,
        toStage: stage,
        source: 'automation:replay',
        externalId: ev.id,
      });

      // état courant
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { stage, stageUpdatedAt: new Date(), boardColumnKey: null },
      });
    }

    // on marque l’event comme traité
    await this.prisma.automationEvent.update({
      where: { id: ev.id },
      data: {
        status: 'PROCESSED',
        result: { leadId, stage, report, replay: true, mode },
        processedAt: new Date(),
      },
    });

    return { ok: true, leadId, mode };
  }

  // Compat avec HookController existant
  async receiveWebhook(routeKey: string, _contentType: string, payload: any) {
    const res = await this.processAutomationHook(routeKey, payload);
    // le controller attend { id: ... }
    return { id: res.eventId };
  }

  // ========= Webhook entrant (appelé par HookController) =========
  async processAutomationHook(routeKeyStr: string, payload: any) {
    const auto = await this.prisma.automation.findUnique({
      where: { routeKey: routeKeyStr },
    });
    if (!auto) throw new NotFoundException('Automation introuvable');

    const payloadHash = this.hash(JSON.stringify(payload || {}));
    const event = await this.prisma.automationEvent.create({
      data: {
        automationId: auto.id,
        payload,
        payloadHash,
        contentType: 'application/json',
        status: 'RECEIVED',
      },
    });

    const { mapped, stage, report } = this.applyMapping(
      auto.mappingJson as any,
      payload,
    );

    // --- HARD GATE anti "Unknown" ---
    const gate = mappingGateReason(mapped);
    if (gate) {
      await this.prisma.automationEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          result: {
            ignored: true,
            reason: gate,
            preview: mapped,
            stage,
            report,
            dryRun: auto.status !== AutomationStatus.ON,
          },
          processedAt: new Date(),
        },
      });
      return { ok: true, ignored: true, reason: gate, eventId: event.id };
    }

    // DRY RUN
    if (
      auto.status === AutomationStatus.DRY_RUN ||
      auto.status === AutomationStatus.OFF
    ) {
      await this.prisma.automationEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          result: { preview: mapped, stage, report, dryRun: true },
          processedAt: new Date(),
        },
      });
      return {
        ok: true,
        dryRun: true,
        preview: mapped,
        stage,
        report,
        eventId: event.id,
      };
    }

    // --- ON → upsert par email > ghlContactId
    const safeEmail =
      mapped.email && String(mapped.email).includes('@')
        ? String(mapped.email).toLowerCase()
        : null;
    let where: any = undefined;
    if (safeEmail) where = { email: safeEmail };
    else if (mapped.ghlContactId) where = { ghlContactId: String(mapped.ghlContactId) };

    // ⚠️ on va garder la valeur de stage AVANT pour l’event-sourcing
    let previousStage: LeadStage | undefined;

    // on tente l’upsert
    let lead;
    try {
      if (where) {
        // on récupère le stage avant l’upsert (pour l’event)
        const before = await this.prisma.lead.findUnique({
          where,
          select: { stage: true },
        });
        previousStage = before?.stage;

        lead = await this.prisma.lead.upsert({
          where,
          update: this.buildUpdate(mapped),
          create: this.buildCreate(mapped, stage),
        });
      } else {
        lead = await this.prisma.lead.create({
          data: this.buildCreate(mapped, stage),
        });
        previousStage = 'LEADS_RECEIVED';
      }
    } catch {
      // conflit d'email ou autre → on crée un lead “vierge”
      lead = await this.prisma.lead.create({
        data: this.buildCreate(mapped, stage),
      });
      previousStage = 'LEADS_RECEIVED';
    }

    // connect setter/closer si envoyés
    await this.connectActorsIfAny(lead.id, mapped);

    // auto-assign
    await this.autoAssign.apply({
      leadId: lead.id,
      automation: {
        id: auto.id,
        status: auto.status,
        mappingJson: auto.mappingJson as any,
        metaJson: (auto as any).metaJson,
      },
      payload,
      dryRun: false,
    });

    // ✅ ICI : on log l’entrée de stage
    if (stage) {
      await this.stageEvents.recordStageEntry({
        leadId: lead.id,
        fromStage: previousStage ?? lead.stage ?? 'LEADS_RECEIVED',
        toStage: stage,
        source: 'automation:webhook',
        externalId: event.id,
      });

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { stage, stageUpdatedAt: new Date(), boardColumnKey: null },
      });
    }

    // on clôt l’event
    await this.prisma.automationEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
        result: { leadId: lead.id, stage, report },
        processedAt: new Date(),
      },
    });

    return { ok: true, leadId: lead.id, stage, report, eventId: event.id };
  }

  /**
   * Supprime un lead et toutes ses dépendances directes
   */
  async deleteLeadCompletely(leadId: string) {
    const exists = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Lead not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({ where: { leadId } });
      await tx.contract.deleteMany({ where: { leadId } });
      await tx.callAttempt.deleteMany({ where: { leadId } });
      await tx.callRequest.deleteMany({ where: { leadId } });
      await tx.leadEvent.deleteMany({ where: { leadId } });
      await tx.leadBoardEvent.deleteMany({ where: { leadId } });
      await tx.lead.delete({ where: { id: leadId } });
    });

    return { ok: true, deletedId: leadId };
  }

  // ========= Helpers mapping / persistance =========
  private buildCreate(m: any, stage?: LeadStage) {
    return {
      firstName: m.firstName || 'Unknown',
      lastName: m.lastName ?? null,
      email: m.email ?? null,
      phone: m.phone ?? null,
      tag: m.tag ?? null,
      source: m.source ?? 'GHL',
      ghlContactId: m.ghlContactId ?? null,
      opportunityValue:
        m.opportunityValue != null ? Number(m.opportunityValue) : null,
      saleValue: m.saleValue != null ? Number(m.saleValue) : null,
      stage: stage ?? LeadStage.LEADS_RECEIVED,
      stageUpdatedAt: new Date(),
    };
  }

  private buildUpdate(m: any) {
    const data: any = {
      firstName: m.firstName ?? undefined,
      lastName: m.lastName ?? undefined,
      phone: m.phone ?? undefined,
      tag: m.tag ?? undefined,
      source: m.source ?? undefined,
      ghlContactId: m.ghlContactId ?? undefined,
    };
    if (m.email) data.email = String(m.email).toLowerCase();
    if (m.opportunityValue != null)
      data.opportunityValue = Number(m.opportunityValue);
    if (m.saleValue != null) data.saleValue = Number(m.saleValue);
    return data;
  }

  private async connectActorsIfAny(leadId: string, m: any) {
    const setEmail = m.setterEmail ? String(m.setterEmail).toLowerCase() : null;
    const closEmail = m.closerEmail ? String(m.closerEmail).toLowerCase() : null;

    if (setEmail) {
      const u = await this.prisma.user.findFirst({
        where: { email: setEmail, role: Role.SETTER, isActive: true },
      });
      if (u)
        await this.prisma.lead.update({
          where: { id: leadId },
          data: { setterId: u.id },
        });
    }
    if (closEmail) {
      const u = await this.prisma.user.findFirst({
        where: { email: closEmail, role: Role.CLOSER, isActive: true },
      });
      if (u)
        await this.prisma.lead.update({
          where: { id: leadId },
          data: { closerId: u.id },
        });
    }

    if (m.setterId) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { setterId: String(m.setterId) },
      });
    }
    if (m.closerId) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { closerId: String(m.closerId) },
      });
    }
  }

  private async safeCreateLeadEvent(leadId: string, type: string, meta?: any) {
    try {
      await this.prisma.leadEvent.create({
        data: { leadId, type, meta, occurredAt: new Date() },
      });
    } catch {}
  }

  private stageToEvent(stage: LeadStage): string {
    const map: Record<LeadStage, string> = {
      LEADS_RECEIVED: 'LEAD_CREATED',
      CALL_REQUESTED: 'CALL_REQUESTED',
      CALL_ATTEMPT: 'CALL_ATTEMPT',
      CALL_ANSWERED: 'CALL_ANSWERED',
      SETTER_NO_SHOW: 'SETTER_NO_SHOW',
      FOLLOW_UP: 'FOLLOW_UP',
      RV0_PLANNED: 'APPOINTMENT_PLANNED_RV0',
      RV0_HONORED: 'APPOINTMENT_HONORED_RV0',
      RV0_NO_SHOW: 'APPOINTMENT_NOSHOW_RV0',
      RV1_PLANNED: 'APPOINTMENT_PLANNED_RV1',
      RV1_HONORED: 'APPOINTMENT_HONORED_RV1',
      RV1_NO_SHOW: 'APPOINTMENT_NOSHOW_RV1',
      RV1_POSTPONED: 'APPOINTMENT_POSTPONED_RV1',
      RV2_PLANNED: 'APPOINTMENT_PLANNED_RV2',
      RV2_HONORED: 'APPOINTMENT_HONORED_RV2',
      RV2_POSTPONED: 'APPOINTMENT_POSTPONED_RV2',
      NOT_QUALIFIED: 'NOT_QUALIFIED',
      LOST: 'LOST',
      WON: 'WON',
    };
    return map[stage] || stage;
  }

  private hash(s: string) {
    let h = 0,
      i = 0;
    while (i < s.length) {
      h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
    }
    return String(h);
  }

  /**
   * Applique mappingJson → { mapped(fields), stage?, report }
   */
  private applyMapping(
    mapping: any,
    payload: any,
  ): { mapped: any; stage?: LeadStage; report: any } {
    const fields = mapping?.fields ?? {};
    const mapped: any = {};

    for (const key of [
      'firstName',
      'lastName',
      'email',
      'phone',
      'tag',
      'source',
      'opportunityValue',
      'saleValue',
      'ghlContactId',
      'setterEmail',
      'closerEmail',
      'setterId',
      'closerId',
    ]) {
      const from = fields?.[key]?.from as string | undefined;
      if (from) mapped[key] = getByPath(payload, from);
      else if (fields?.[key]?.const != null) mapped[key] = fields[key].const;
    }

    mapped.firstName = mapped.firstName || 'Unknown';
    if (mapped.email) mapped.email = String(mapped.email).toLowerCase();

    let stage: LeadStage | undefined;
    const mode = (mapping?.stage?.mode || 'table') as
      | 'fixed'
      | 'table'
      | 'none';

    if (mode === 'fixed') {
      stage = toEnumStage(mapping?.stage?.fixed);
    } else if (mode === 'table') {
      const from = mapping?.stage?.table?.from as string | undefined;
      const raw = from ? getByPath(payload, from) : undefined;
      const mapObj: Record<string, string> = mapping?.stage?.table?.map || {};
      let target =
        raw != null
          ? mapObj[String(raw)] ??
            mapObj[String(raw).toUpperCase()] ??
            mapObj[String(raw).trim()] ??
            undefined
          : undefined;
      if (!target) target = mapping?.stage?.table?.fallback;
      stage = toEnumStage(target);
    }

    const report = { mode, resolvedStage: stage ?? null };
    return { mapped, stage, report };
  }
}
