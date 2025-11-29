"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const auto_assign_service_1 = require("./auto-assign.service");
const stage_events_service_1 = require("../modules/leads/stage-events.service");
function getByPath(obj, path) {
    if (!obj || !path)
        return undefined;
    return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
}
function baseUrl() {
    const raw = (process.env.PUBLIC_BASE_URL || '').trim();
    if (!raw)
        return '';
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
function routeKey() {
    return (Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10));
}
function makeAbsoluteWebhookUrl(routeKeyStr) {
    const b = baseUrl();
    return b ? `${b}/hook/${routeKeyStr}` : `/hook/${routeKeyStr}`;
}
function mappingGateReason(mapped) {
    const safeEmail = mapped.email && String(mapped.email).includes('@')
        ? String(mapped.email).toLowerCase()
        : null;
    const hasIdentifier = Boolean(safeEmail || mapped?.phone || mapped?.ghlContactId);
    if (!hasIdentifier) {
        return 'mapping_incomplete_no_identifier';
    }
    return null;
}
const LEGACY_TO_NEW = {
    LEAD_RECU: "LEADS_RECEIVED",
    DEMANDE_APPEL: "CALL_REQUESTED",
    APPEL_PASSE: "CALL_ATTEMPT",
    APPEL_REPONDU: "CALL_ANSWERED",
    NO_SHOW_SETTER: "SETTER_NO_SHOW",
    FOLLOW_UP: "FOLLOW_UP",
    RV0_PLANIFIE: "RV0_PLANNED",
    RV0_HONORE: "RV0_HONORED",
    RV0_NO_SHOW: "RV0_NO_SHOW",
    RV0_CANCELED: 'RV0_CANCELED',
    RV1_PLANIFIE: "RV1_PLANNED",
    RV1_HONORE: "RV1_HONORED",
    RV1_NO_SHOW: "RV1_NO_SHOW",
    RV1_CANCELED: 'RV1_CANCELED',
    RV2_PLANIFIE: "RV2_PLANNED",
    RV2_HONORE: "RV2_HONORED",
    RV2_NO_SHOW: "RV2_NO_SHOW",
    RV2_CANCELED: 'RV2_CANCELED',
    WON: "WON",
    LOST: "LOST",
    NOT_QUALIFIED: "NOT_QUALIFIED",
};
function toEnumStage(val) {
    if (!val)
        return undefined;
    const raw = String(val).trim().toUpperCase();
    if (raw in LEGACY_TO_NEW)
        return LEGACY_TO_NEW[raw];
    const all = Object.values(client_1.LeadStage);
    return all.includes(raw) ? raw : undefined;
}
let IntegrationsService = class IntegrationsService {
    prisma;
    autoAssign;
    stageEvents;
    constructor(prisma, autoAssign, stageEvents) {
        this.prisma = prisma;
        this.autoAssign = autoAssign;
        this.stageEvents = stageEvents;
    }
    async createAutomation(name) {
        const rk = routeKey();
        const a = await this.prisma.automation.create({
            data: {
                name,
                routeKey: rk,
                status: client_1.AutomationStatus.DRY_RUN,
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
    async getAutomation(id) {
        const a = await this.prisma.automation.findUnique({ where: { id } });
        if (!a)
            throw new common_1.NotFoundException('Automation not found');
        return a;
    }
    async decorateAutomationAbsolute(id) {
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
    async getAutomationWithAbsoluteUrl(id) {
        return this.decorateAutomationAbsolute(id);
    }
    async updateAutomation(id, body) {
        const data = {
            ...(body.name ? { name: body.name } : {}),
            ...(body.status ? { status: body.status } : {}),
            ...(Object.prototype.hasOwnProperty.call(body, 'mappingJson')
                ? {
                    mappingJson: (body.mappingJson ?? client_1.Prisma.JsonNull),
                }
                : {}),
        };
        const a = await this.prisma.automation.update({ where: { id }, data });
        return { ok: true, id: a.id };
    }
    async deleteAutomation(id) {
        await this.prisma.automation.delete({ where: { id } });
    }
    async duplicateAutomation(id) {
        const a = await this.getAutomation(id);
        const rk = routeKey();
        const b = await this.prisma.automation.create({
            data: {
                name: `${a.name} (copy)`,
                routeKey: rk,
                status: a.status,
                mappingJson: a.mappingJson,
                rulesJson: a.rulesJson,
            },
        });
        return this.decorateAutomationAbsolute(b.id);
    }
    async listEvents(automationId, limit) {
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
    async replayEvent(eventId, opts) {
        const mode = opts?.mode || 'upsert';
        const ev = await this.prisma.automationEvent.findUnique({
            where: { id: eventId },
            include: { automation: true },
        });
        if (!ev)
            throw new common_1.NotFoundException('Event not found');
        const auto = ev.automation;
        const { mapped, stage, report } = this.applyMapping(auto.mappingJson, ev.payload);
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
                        dryRun: auto.status !== client_1.AutomationStatus.ON,
                    },
                    processedAt: new Date(),
                },
            });
            return { ok: true, ignored: true, reason: gate };
        }
        if (auto.status !== client_1.AutomationStatus.ON) {
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
        const safeEmail = mapped.email && String(mapped.email).includes('@')
            ? String(mapped.email).toLowerCase()
            : null;
        let existing = null;
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
        let leadId;
        let createdNow = false;
        if (existing) {
            const updated = await this.prisma.lead.update({
                where: { id: existing.id },
                data: this.buildUpdate(mapped),
            });
            leadId = updated.id;
        }
        else {
            try {
                const created = await this.prisma.lead.create({
                    data: this.buildCreate(mapped, stage),
                });
                leadId = created.id;
                createdNow = true;
            }
            catch (e) {
                if (mode === 'createNew' &&
                    e?.code === 'P2002' &&
                    e?.meta?.target?.includes?.('email')) {
                    const created = await this.prisma.lead.create({
                        data: { ...this.buildCreate(mapped, stage), email: null },
                    });
                    leadId = created.id;
                    createdNow = true;
                }
                else {
                    throw e;
                }
            }
        }
        await this.connectActorsIfAny(leadId, mapped);
        await this.autoAssign.apply({
            leadId,
            automation: {
                id: auto.id,
                status: auto.status,
                mappingJson: auto.mappingJson,
                metaJson: auto.metaJson,
            },
            payload: ev.payload,
            dryRun: false,
        });
        if (stage) {
            const prevStage = existing?.stage ??
                (createdNow ? 'LEADS_RECEIVED' : 'LEADS_RECEIVED');
            await this.stageEvents.recordStageEntry({
                leadId,
                fromStage: prevStage,
                toStage: stage,
                source: 'automation:replay',
                externalId: ev.id,
            });
            await this.prisma.lead.update({
                where: { id: leadId },
                data: { stage, stageUpdatedAt: new Date(), boardColumnKey: null },
            });
        }
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
    async receiveWebhook(routeKey, _contentType, payload) {
        const res = await this.processAutomationHook(routeKey, payload);
        return { id: res.eventId };
    }
    async processAutomationHook(routeKeyStr, payload) {
        const auto = await this.prisma.automation.findUnique({
            where: { routeKey: routeKeyStr },
        });
        if (!auto)
            throw new common_1.NotFoundException('Automation introuvable');
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
        const { mapped, stage, report } = this.applyMapping(auto.mappingJson, payload);
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
                        dryRun: auto.status !== client_1.AutomationStatus.ON,
                    },
                    processedAt: new Date(),
                },
            });
            return { ok: true, ignored: true, reason: gate, eventId: event.id };
        }
        if (auto.status === client_1.AutomationStatus.DRY_RUN ||
            auto.status === client_1.AutomationStatus.OFF) {
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
        const safeEmail = mapped.email && String(mapped.email).includes('@')
            ? String(mapped.email).toLowerCase()
            : null;
        let where = undefined;
        if (safeEmail)
            where = { email: safeEmail };
        else if (mapped.ghlContactId)
            where = { ghlContactId: String(mapped.ghlContactId) };
        let previousStage;
        let lead;
        try {
            if (where) {
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
            }
            else {
                lead = await this.prisma.lead.create({
                    data: this.buildCreate(mapped, stage),
                });
                previousStage = 'LEADS_RECEIVED';
            }
        }
        catch {
            lead = await this.prisma.lead.create({
                data: this.buildCreate(mapped, stage),
            });
            previousStage = 'LEADS_RECEIVED';
        }
        await this.connectActorsIfAny(lead.id, mapped);
        await this.autoAssign.apply({
            leadId: lead.id,
            automation: {
                id: auto.id,
                status: auto.status,
                mappingJson: auto.mappingJson,
                metaJson: auto.metaJson,
            },
            payload,
            dryRun: false,
        });
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
    async deleteLeadCompletely(leadId) {
        const exists = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: { id: true },
        });
        if (!exists)
            throw new common_1.NotFoundException('Lead not found');
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
    buildCreate(m, stage) {
        return {
            firstName: m.firstName || 'Unknown',
            lastName: m.lastName ?? null,
            email: m.email ?? null,
            phone: m.phone ?? null,
            tag: m.tag ?? null,
            source: m.source ?? 'GHL',
            ghlContactId: m.ghlContactId ?? null,
            opportunityValue: m.opportunityValue != null ? Number(m.opportunityValue) : null,
            saleValue: m.saleValue != null ? Number(m.saleValue) : null,
            stage: stage ?? client_1.LeadStage.LEADS_RECEIVED,
            stageUpdatedAt: new Date(),
        };
    }
    buildUpdate(m) {
        const data = {
            firstName: m.firstName ?? undefined,
            lastName: m.lastName ?? undefined,
            phone: m.phone ?? undefined,
            tag: m.tag ?? undefined,
            source: m.source ?? undefined,
            ghlContactId: m.ghlContactId ?? undefined,
        };
        if (m.email)
            data.email = String(m.email).toLowerCase();
        if (m.opportunityValue != null)
            data.opportunityValue = Number(m.opportunityValue);
        if (m.saleValue != null)
            data.saleValue = Number(m.saleValue);
        return data;
    }
    async connectActorsIfAny(leadId, m) {
        const setEmail = m.setterEmail ? String(m.setterEmail).toLowerCase() : null;
        const closEmail = m.closerEmail ? String(m.closerEmail).toLowerCase() : null;
        if (setEmail) {
            const u = await this.prisma.user.findFirst({
                where: { email: setEmail, role: client_1.Role.SETTER, isActive: true },
            });
            if (u)
                await this.prisma.lead.update({
                    where: { id: leadId },
                    data: { setterId: u.id },
                });
        }
        if (closEmail) {
            const u = await this.prisma.user.findFirst({
                where: { email: closEmail, role: client_1.Role.CLOSER, isActive: true },
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
    async safeCreateLeadEvent(leadId, type, meta) {
        try {
            await this.prisma.leadEvent.create({
                data: { leadId, type, meta, occurredAt: new Date() },
            });
        }
        catch { }
    }
    stageToEvent(stage) {
        const map = {
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
    hash(s) {
        let h = 0, i = 0;
        while (i < s.length) {
            h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
        }
        return String(h);
    }
    applyMapping(mapping, payload) {
        const fields = mapping?.fields ?? {};
        const mapped = {};
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
            const from = fields?.[key]?.from;
            if (from)
                mapped[key] = getByPath(payload, from);
            else if (fields?.[key]?.const != null)
                mapped[key] = fields[key].const;
        }
        mapped.firstName = mapped.firstName || 'Unknown';
        if (mapped.email)
            mapped.email = String(mapped.email).toLowerCase();
        let stage;
        const mode = (mapping?.stage?.mode || 'table');
        if (mode === 'fixed') {
            stage = toEnumStage(mapping?.stage?.fixed);
        }
        else if (mode === 'table') {
            const from = mapping?.stage?.table?.from;
            const raw = from ? getByPath(payload, from) : undefined;
            const mapObj = mapping?.stage?.table?.map || {};
            let target = raw != null
                ? mapObj[String(raw)] ??
                    mapObj[String(raw).toUpperCase()] ??
                    mapObj[String(raw).trim()] ??
                    undefined
                : undefined;
            if (!target)
                target = mapping?.stage?.table?.fallback;
            stage = toEnumStage(target);
        }
        const report = { mode, resolvedStage: stage ?? null };
        return { mapped, stage, report };
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auto_assign_service_1.AutoAssignService,
        stage_events_service_1.StageEventsService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map