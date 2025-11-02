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
exports.ProspectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const reporting_service_1 = require("../reporting/reporting.service");
const stage_events_service_1 = require("../modules/leads/stage-events.service");
const create_prospect_event_dto_1 = require("./dto/create-prospect-event.dto");
const DEFAULT_METRICS = [
    { key: 'LEADS_RECEIVED', label: 'Leads reçus', sourcePath: 'funnel.totals.leads', order: 0, enabled: true },
    { key: 'CALL_REQUESTED', label: 'Demandes d’appel', sourcePath: 'funnel.totals.callRequests', order: 1, enabled: true },
    { key: 'CALL_ATTEMPT', label: 'Appels passés', sourcePath: 'funnel.totals.callsTotal', order: 2, enabled: true },
    { key: 'CALL_ANSWERED', label: 'Appels répondus', sourcePath: 'funnel.totals.callsAnswered', order: 3, enabled: true },
    { key: 'SETTER_NO_SHOW', label: 'No-show Setter', sourcePath: 'funnel.totals.setterNoShow', order: 4, enabled: true },
    { key: 'FOLLOW_UP', label: 'Follow Up (Financement)', sourcePath: 'funnel.totals.followUp', order: 5, enabled: true },
    { key: 'RV0_PLANNED', label: 'RV0 planifiés', sourcePath: 'funnel.totals.rv0Planned', order: 6, enabled: true },
    { key: 'RV0_HONORED', label: 'RV0 honorés', sourcePath: 'funnel.totals.rv0Honored', order: 7, enabled: true },
    { key: 'RV0_NO_SHOW', label: 'RV0 no-show', sourcePath: 'funnel.totals.rv0NoShow', order: 8, enabled: true },
    { key: 'RV1_PLANNED', label: 'RV1 planifiés', sourcePath: 'funnel.totals.rv1Planned', order: 9, enabled: true },
    { key: 'RV1_HONORED', label: 'RV1 honorés', sourcePath: 'funnel.totals.rv1Honored', order: 10, enabled: true },
    { key: 'RV1_NO_SHOW', label: 'RV1 no-show', sourcePath: 'funnel.totals.rv1NoShow', order: 11, enabled: true },
    { key: 'RV1_POSTPONED', label: 'RV1 reportés', sourcePath: 'funnel.totals.rv1Postponed', order: 12, enabled: true },
    { key: 'RV2_PLANNED', label: 'RV2 planifiés', sourcePath: 'funnel.totals.rv2Planned', order: 13, enabled: true },
    { key: 'RV2_HONORED', label: 'RV2 honorés', sourcePath: 'funnel.totals.rv2Honored', order: 14, enabled: true },
    { key: 'RV2_POSTPONED', label: 'RV2 reportés', sourcePath: 'funnel.totals.rv2Postponed', order: 15, enabled: true },
    { key: 'NOT_QUALIFIED', label: 'Non qualifiés', sourcePath: 'funnel.totals.notQualified', order: 16, enabled: true },
    { key: 'LOST', label: 'Perdus', sourcePath: 'funnel.totals.lost', order: 17, enabled: true },
    { key: 'WON', label: 'Ventes (WON)', sourcePath: 'funnel.totals.wonCount', order: 18, enabled: true },
];
const STAGE_TO_EVENT = {
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
const EVENT_BASED_STAGES = [
    'CALL_REQUESTED',
    'CALL_ATTEMPT',
    'CALL_ANSWERED',
    'SETTER_NO_SHOW',
    'FOLLOW_UP',
    'RV0_PLANNED',
    'RV0_HONORED',
    'RV0_NO_SHOW',
    'RV1_PLANNED',
    'RV1_HONORED',
    'RV1_NO_SHOW',
    'RV1_POSTPONED',
    'RV2_PLANNED',
    'RV2_HONORED',
    'RV2_POSTPONED',
    'NOT_QUALIFIED',
    'LOST',
    'WON',
];
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}
function toUTCDateOnly(s) {
    if (!s)
        return undefined;
    if (s.includes('T')) {
        const d = new Date(s);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    }
    const [y, m, d] = s.split('-').map((x) => Number(x));
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
const startOfDayUTC = (s) => (s ? toUTCDateOnly(s) : undefined);
function endOfDayUTC(s) {
    if (!s)
        return undefined;
    const d0 = toUTCDateOnly(s);
    const d1 = new Date(d0.getTime());
    d1.setUTCHours(23, 59, 59, 999);
    return d1;
}
function toRange(from, to) {
    return { from: startOfDayUTC(from), to: endOfDayUTC(to) };
}
function between(field, r) {
    if (!r.from && !r.to)
        return {};
    return { [field]: { gte: r.from ?? undefined, lte: r.to ?? undefined } };
}
const mapStageDtoToLeadStage = (s) => {
    switch (s) {
        case create_prospect_event_dto_1.StageDto.LEAD_RECU: return 'LEADS_RECEIVED';
        case create_prospect_event_dto_1.StageDto.DEMANDE_APPEL: return 'CALL_REQUESTED';
        case create_prospect_event_dto_1.StageDto.APPEL_PASSE: return 'CALL_ATTEMPT';
        case create_prospect_event_dto_1.StageDto.APPEL_REPONDU: return 'CALL_ANSWERED';
        case create_prospect_event_dto_1.StageDto.NO_SHOW_SETTER: return 'SETTER_NO_SHOW';
        case create_prospect_event_dto_1.StageDto.RV0_PLANIFIE: return 'RV0_PLANNED';
        case create_prospect_event_dto_1.StageDto.RV0_HONORE: return 'RV0_HONORED';
        case create_prospect_event_dto_1.StageDto.RV0_NO_SHOW: return 'RV0_NO_SHOW';
        case create_prospect_event_dto_1.StageDto.RV1_PLANIFIE: return 'RV1_PLANNED';
        case create_prospect_event_dto_1.StageDto.RV1_HONORE: return 'RV1_HONORED';
        case create_prospect_event_dto_1.StageDto.RV1_NO_SHOW: return 'RV1_NO_SHOW';
        case create_prospect_event_dto_1.StageDto.RV2_PLANIFIE: return 'RV2_PLANNED';
        case create_prospect_event_dto_1.StageDto.RV2_HONORE: return 'RV2_HONORED';
        case create_prospect_event_dto_1.StageDto.WON: return 'WON';
        case create_prospect_event_dto_1.StageDto.LOST: return 'LOST';
        case create_prospect_event_dto_1.StageDto.NOT_QUALIFIED: return 'NOT_QUALIFIED';
        default: return 'LEADS_RECEIVED';
    }
};
let ProspectsService = class ProspectsService {
    prisma;
    reporting;
    stageEvents;
    constructor(prisma, reporting, stageEvents) {
        this.prisma = prisma;
        this.reporting = reporting;
        this.stageEvents = stageEvents;
    }
    getMetricsCatalog() {
        return {
            ok: true,
            catalog: DEFAULT_METRICS.map(({ key, label, sourcePath, order, enabled }) => ({
                key, label, sourcePath, order, enabled,
            })),
        };
    }
    async moveToFreeColumn(leadId, columnKey) {
        if (!columnKey)
            throw new common_1.BadRequestException('columnKey requis');
        const [lead, column] = await Promise.all([
            this.prisma.lead.findUnique({ where: { id: leadId } }),
            this.prisma.prospectsColumnConfig.findUnique({ where: { id: columnKey } }).catch(() => null),
        ]);
        if (!lead)
            throw new common_1.NotFoundException('Lead introuvable');
        const prev = lead.boardColumnKey ?? null;
        try {
            await this.prisma.leadBoardEvent?.create?.({
                data: { leadId, columnKey, previousKey: prev, movedAt: new Date() },
            });
        }
        catch { }
        try {
            await this.prisma.lead.update({
                where: { id: leadId },
                data: { boardColumnKey: columnKey },
            });
        }
        catch { }
        if (column?.stage) {
            const stage = column.stage;
            const type = STAGE_TO_EVENT[stage];
            try {
                await this.prisma.leadEvent?.create?.({
                    data: {
                        leadId,
                        type,
                        meta: { source: 'board-drop', columnKey, stage },
                        occurredAt: new Date(),
                    },
                });
            }
            catch { }
            try {
                await this.prisma.lead.update({
                    where: { id: leadId },
                    data: { stage, stageUpdatedAt: new Date() },
                });
            }
            catch { }
            try {
                await this.ensureStageHistory(leadId, stage);
            }
            catch { }
        }
        return { ok: true };
    }
    async ensureStageHistory(leadId, stage, at) {
        try {
            await this.prisma.leadStageHistory?.upsert({
                where: {
                    lead_stage_unique: {
                        leadId,
                        stage,
                    },
                },
                update: {},
                create: {
                    leadId,
                    stage,
                    occurredAt: at ?? new Date(),
                },
            });
        }
        catch (e) {
        }
    }
    async changeStage(leadId, dto) {
        const normalized = this.safeStage(dto.stage);
        const updated = await this.prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: normalized,
                stageUpdatedAt: new Date(),
            },
        });
        await this.ensureStageHistory(leadId, normalized);
        return updated;
    }
    DEFAULT_BOARD_COLUMNS = [
        { label: 'Leads reçus', stage: 'LEADS_RECEIVED', order: 0, enabled: true },
        { label: 'Demandes d’appel', stage: 'CALL_REQUESTED', order: 1, enabled: true },
        { label: 'Appels passés', stage: 'CALL_ATTEMPT', order: 2, enabled: true },
        { label: 'Appels répondus', stage: 'CALL_ANSWERED', order: 3, enabled: true },
        { label: 'No-show Setter', stage: 'SETTER_NO_SHOW', order: 4, enabled: false },
        { label: 'Follow Up', stage: 'FOLLOW_UP', order: 5, enabled: true },
        { label: 'RV0 planifiés', stage: 'RV0_PLANNED', order: 10, enabled: true },
        { label: 'RV0 honorés', stage: 'RV0_HONORED', order: 11, enabled: false },
        { label: 'RV0 no-show', stage: 'RV0_NO_SHOW', order: 12, enabled: false },
        { label: 'RV1 planifiés', stage: 'RV1_PLANNED', order: 20, enabled: true },
        { label: 'RV1 honorés', stage: 'RV1_HONORED', order: 21, enabled: true },
        { label: 'RV1 no-show', stage: 'RV1_NO_SHOW', order: 22, enabled: false },
        { label: 'RV1 reportés', stage: 'RV1_POSTPONED', order: 23, enabled: false },
        { label: 'RV2 planifiés', stage: 'RV2_PLANNED', order: 30, enabled: false },
        { label: 'RV2 honorés', stage: 'RV2_HONORED', order: 31, enabled: false },
        { label: 'RV2 reportés', stage: 'RV2_POSTPONED', order: 32, enabled: false },
        { label: 'Non qualifiés', stage: 'NOT_QUALIFIED', order: 90, enabled: true },
        { label: 'Perdus', stage: 'LOST', order: 91, enabled: true },
        { label: 'Ventes (WON)', stage: 'WON', order: 99, enabled: true },
    ];
    async getColumnsConfig() {
        let rows = await this.prisma.prospectsColumnConfig.findMany({ orderBy: { order: 'asc' } });
        if (!rows.length) {
            await this.prisma.$transaction(this.DEFAULT_BOARD_COLUMNS.map((c) => this.prisma.prospectsColumnConfig.create({
                data: { label: c.label, stage: c.stage ?? null, order: c.order, enabled: c.enabled },
            })));
            rows = await this.prisma.prospectsColumnConfig.findMany({ orderBy: { order: 'asc' } });
        }
        return { ok: true, columns: rows };
    }
    async putColumnsConfig(payload) {
        if (!Array.isArray(payload))
            throw new common_1.BadRequestException('Payload invalide');
        const normalized = payload.map((c, idx) => ({
            id: c.id,
            label: c.label,
            order: typeof c.order === 'number' ? c.order : idx,
            enabled: typeof c.enabled === 'boolean' ? c.enabled : true,
            stage: c.stage ?? null,
        }));
        await this.prisma.$transaction(normalized.map((c) => c.id
            ? this.prisma.prospectsColumnConfig.update({
                where: { id: c.id },
                data: {
                    label: c.label ?? undefined,
                    order: c.order,
                    enabled: c.enabled,
                    stage: c.stage,
                },
            })
            : this.prisma.prospectsColumnConfig.create({
                data: {
                    label: c.label || 'Sans nom',
                    order: c.order,
                    enabled: c.enabled,
                    stage: c.stage,
                },
            })));
        const rows = await this.prisma.prospectsColumnConfig.findMany({ orderBy: { order: 'asc' } });
        return { ok: true, columns: rows };
    }
    async updateLeadStage(leadId, toStage, source, externalId) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { stage: true } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        await this.stageEvents.recordStageEntry({
            leadId,
            fromStage: lead.stage,
            toStage,
            source,
            externalId,
        });
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { stage: toStage, stageUpdatedAt: new Date(), boardColumnKey: null },
        });
        await this.ensureStageHistory(leadId, toStage);
        return { ok: true };
    }
    async moveToBoardColumn(leadId, columnKey) {
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { boardColumnKey: columnKey, stageUpdatedAt: new Date() },
        });
        return { ok: true };
    }
    buildRangeOr(from, to) {
        const r = toRange(from, to);
        if (!r.from && !r.to)
            return {};
        return {
            OR: [
                { createdAt: { gte: r.from ?? undefined, lte: r.to ?? undefined } },
                { stageUpdatedAt: { gte: r.from ?? undefined, lte: r.to ?? undefined } },
            ],
        };
    }
    async getBoard({ from, to, limit = 200 }) {
        const where = this.buildRangeOr(from, to);
        const leads = await this.prisma.lead.findMany({
            where,
            orderBy: { stageUpdatedAt: 'desc' },
            include: {
                setter: { select: { id: true, firstName: true, email: true } },
                closer: { select: { id: true, firstName: true, email: true } },
            },
            take: 2000,
        });
        const emptyCol = () => ({
            count: 0,
            sumOpportunity: 0,
            sumSales: 0,
            items: [],
        });
        const allStages = [
            'LEADS_RECEIVED',
            'CALL_REQUESTED',
            'CALL_ATTEMPT',
            'CALL_ANSWERED',
            'SETTER_NO_SHOW',
            'FOLLOW_UP',
            'RV0_PLANNED',
            'RV0_HONORED',
            'RV0_NO_SHOW',
            'RV1_PLANNED',
            'RV1_HONORED',
            'RV1_NO_SHOW',
            'RV1_POSTPONED',
            'RV2_PLANNED',
            'RV2_HONORED',
            'RV2_POSTPONED',
            'NOT_QUALIFIED',
            'LOST',
            'WON',
        ];
        const columns = {};
        for (const s of allStages)
            columns[s] = emptyCol();
        for (const l of leads) {
            const col = columns[l.stage] ?? columns['LEADS_RECEIVED'];
            if (col.items.length < limit)
                col.items.push(l);
            col.count += 1;
            col.sumOpportunity += l.opportunityValue ?? 0;
            col.sumSales += l.saleValue ?? 0;
        }
        return { columns };
    }
    ensureNonNegative(label, v) {
        if (v == null)
            return;
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
            throw new common_1.BadRequestException(`${label} doit être un nombre >= 0`);
        }
    }
    async moveStage(id, body) {
        const target = body.stage;
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead)
            throw new common_1.BadRequestException('Lead introuvable');
        if (target === 'WON') {
            let saleValueToSet = null;
            if (typeof body.saleValue === 'number') {
                this.ensureNonNegative('saleValue', body.saleValue);
                saleValueToSet = Math.round(body.saleValue);
            }
            else if (body.confirmSame && lead.opportunityValue != null) {
                this.ensureNonNegative('opportunityValue', lead.opportunityValue);
                saleValueToSet = Math.round(lead.opportunityValue);
            }
            else if (lead.saleValue != null) {
                this.ensureNonNegative('saleValue', lead.saleValue);
                saleValueToSet = lead.saleValue;
            }
            else {
                throw new common_1.BadRequestException({
                    code: 'SALE_VALUE_REQUIRED',
                    message: 'Merci de renseigner la valeur réelle de la vente (>= 0) ou de confirmer la valeur d’opportunité.',
                });
            }
            const updated = await this.prisma.lead.update({
                where: { id },
                data: { stage: 'WON', saleValue: saleValueToSet, stageUpdatedAt: new Date() },
                include: {
                    setter: { select: { id: true, firstName: true, email: true } },
                    closer: { select: { id: true, firstName: true, email: true } },
                },
            });
            try {
                await this.prisma.leadEvent?.create?.({
                    data: {
                        leadId: id,
                        type: 'WON',
                        occurredAt: new Date(),
                        meta: { source: 'moveStage' },
                    },
                });
            }
            catch { }
            await this.ensureStageHistory(id, 'WON');
            return { ok: true, lead: updated };
        }
        const updated = await this.prisma.lead.update({
            where: { id },
            data: { stage: target, stageUpdatedAt: new Date() },
            include: {
                setter: { select: { id: true, firstName: true, email: true } },
                closer: { select: { id: true, firstName: true, email: true } },
            },
        });
        if (EVENT_BASED_STAGES.includes(target)) {
            try {
                await this.prisma.leadEvent?.create?.({
                    data: {
                        leadId: id,
                        type: target,
                        occurredAt: new Date(),
                        meta: { source: 'moveStage' },
                    },
                });
            }
            catch { }
        }
        await this.ensureStageHistory(id, target);
        return { ok: true, lead: updated };
    }
    async getOne(id) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                setter: { select: { id: true, firstName: true, email: true } },
                closer: { select: { id: true, firstName: true, email: true } },
            },
        });
        if (!lead)
            throw new common_1.BadRequestException('Lead introuvable');
        return lead;
    }
    async updateOne(id, body) {
        if ('opportunityValue' in body)
            this.ensureNonNegative('opportunityValue', body.opportunityValue ?? null);
        if ('saleValue' in body)
            this.ensureNonNegative('saleValue', body.saleValue ?? null);
        const current = await this.prisma.lead.findUnique({
            where: { id },
            select: { stage: true },
        });
        if (!current)
            throw new common_1.BadRequestException('Lead introuvable');
        const data = {
            firstName: body.firstName ?? undefined,
            lastName: body.lastName ?? undefined,
            email: body.email ?? undefined,
            phone: body.phone ?? undefined,
            tag: body.tag ?? undefined,
            source: body.source ?? undefined,
            opportunityValue: typeof body.opportunityValue === 'number' || body.opportunityValue === null
                ? body.opportunityValue
                : undefined,
            saleValue: typeof body.saleValue === 'number' || body.saleValue === null
                ? body.saleValue
                : undefined,
            setterId: body.setterId === null ? null : body.setterId ?? undefined,
            closerId: body.closerId === null ? null : body.closerId ?? undefined,
        };
        if (current.stage === 'WON' &&
            body.saleValue === undefined &&
            (typeof body.opportunityValue === 'number' || body.opportunityValue === null)) {
            data.saleValue = body.opportunityValue ?? 0;
        }
        const updated = await this.prisma.lead.update({
            where: { id },
            data,
            include: {
                setter: { select: { id: true, firstName: true, email: true } },
                closer: { select: { id: true, firstName: true, email: true } },
            },
        });
        return { ok: true, lead: updated };
    }
    async createLead(body) {
        if ('opportunityValue' in body)
            this.ensureNonNegative('opportunityValue', body.opportunityValue ?? null);
        if ('saleValue' in body)
            this.ensureNonNegative('saleValue', body.saleValue ?? null);
        const stage = body.stage || 'LEADS_RECEIVED';
        let saleValueToSet = typeof body.saleValue === 'number' || body.saleValue === null
            ? body.saleValue
            : undefined;
        if (stage === 'WON' && saleValueToSet === undefined) {
            saleValueToSet = body.opportunityValue ?? 0;
        }
        const payload = {
            firstName: body.firstName || 'Unknown',
            lastName: body.lastName ?? null,
            email: body.email ?? null,
            phone: body.phone ?? null,
            tag: body.tag ?? null,
            source: body.source ?? 'MANUAL',
            opportunityValue: body.opportunityValue ?? null,
            saleValue: saleValueToSet,
            stage,
            setterId: body.setterId ?? undefined,
            closerId: body.closerId ?? undefined,
        };
        const lead = await this.prisma.lead.create({ data: payload });
        try {
            await this.prisma.leadEvent?.create?.({
                data: {
                    leadId: lead.id,
                    type: 'LEAD_CREATED',
                    occurredAt: lead.createdAt,
                    meta: { source: 'createLead' },
                },
            });
        }
        catch { }
        await this.ensureStageHistory(lead.id, 'LEADS_RECEIVED', lead.createdAt);
        return { ok: true, lead };
    }
    async listActors() {
        const [setters, closers] = await Promise.all([
            this.prisma.user.findMany({
                where: { role: client_1.Role.SETTER, isActive: true },
                select: { id: true, firstName: true, email: true },
                orderBy: { firstName: 'asc' },
            }),
            this.prisma.user.findMany({
                where: { role: client_1.Role.CLOSER, isActive: true },
                select: { id: true, firstName: true, email: true },
                orderBy: { firstName: 'asc' },
            }),
        ]);
        return { setters, closers };
    }
    buildCsvTemplate() {
        const header = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'tag',
            'source',
            'opportunityValue',
            'stage',
            'setterEmail',
            'closerEmail',
        ].join(',');
        const sample1 = [
            'Alice',
            'Durand',
            'alice@example.com',
            '+33600000001',
            'FB',
            'CSV',
            '5000',
            'LEADS_RECEIVED',
            '',
            '',
        ].join(',');
        const sample2 = [
            'Bob',
            'Martin',
            'bob@example.com',
            '+33600000002',
            'IG',
            'CSV',
            '3000',
            'RV1_PLANNED',
            'setter1@example.com',
            'closer1@example.com',
        ].join(',');
        return `\uFEFF${header}\n${sample1}\n${sample2}\n`;
    }
    async importCsv(buffer) {
        const text = buffer.toString('utf8');
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length === 0)
            throw new common_1.BadRequestException('CSV vide');
        const header = lines[0].split(',').map(h => h.trim());
        const idx = (name) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
        const col = {
            firstName: idx('firstName'),
            lastName: idx('lastName'),
            email: idx('email'),
            phone: idx('phone'),
            tag: idx('tag'),
            source: idx('source'),
            opportunityValue: idx('opportunityValue'),
            stage: idx('stage'),
            setterEmail: idx('setterEmail'),
            closerEmail: idx('closerEmail'),
        };
        const results = { created: 0, updated: 0, errors: 0 };
        for (let i = 1; i < lines.length; i++) {
            const raw = lines[i];
            if (!raw.trim())
                continue;
            const parts = this.splitCsvLine(raw, header.length);
            try {
                const firstName = (parts[col.firstName] || '').trim() || 'Unknown';
                const lastName = (parts[col.lastName] || '').trim() || null;
                const email = (parts[col.email] || '').trim() || null;
                const phone = (parts[col.phone] || '').trim() || null;
                const tag = (parts[col.tag] || '').trim() || null;
                const source = (parts[col.source] || '').trim() || 'CSV';
                const opportunityValue = this.parseNum(parts[col.opportunityValue]);
                const stageInput = ((parts[col.stage] || '').trim().toUpperCase() || 'LEADS_RECEIVED');
                const setterEmail = (parts[col.setterEmail] || '').trim();
                const closerEmail = (parts[col.closerEmail] || '').trim();
                const stage = this.safeStage(stageInput);
                const setter = setterEmail &&
                    (await this.prisma.user.findFirst({ where: { email: setterEmail, role: 'SETTER' } }));
                const closer = closerEmail &&
                    (await this.prisma.user.findFirst({ where: { email: closerEmail, role: 'CLOSER' } }));
                if (email) {
                    const existing = await this.prisma.lead.findUnique({ where: { email } });
                    if (existing) {
                        await this.prisma.lead.update({
                            where: { id: existing.id },
                            data: {
                                firstName,
                                lastName,
                                phone,
                                tag,
                                source,
                                opportunityValue,
                                saleValue: stage === 'WON' ? (opportunityValue ?? 0) : undefined,
                                stage,
                                setterId: setter ? setter.id : undefined,
                                closerId: closer ? closer.id : undefined,
                                stageUpdatedAt: new Date(),
                            },
                        });
                        await this.ensureStageHistory(existing.id, stage);
                        results.updated++;
                    }
                    else {
                        const created = await this.prisma.lead.create({
                            data: {
                                firstName,
                                lastName,
                                email,
                                phone,
                                tag,
                                source,
                                opportunityValue,
                                saleValue: stage === 'WON' ? (opportunityValue ?? 0) : undefined,
                                stage,
                                setterId: setter ? setter.id : undefined,
                                closerId: closer ? closer.id : undefined,
                            },
                        });
                        try {
                            await this.prisma.leadEvent?.create?.({
                                data: { leadId: created.id, type: 'LEAD_CREATED', occurredAt: created.createdAt, meta: { source: 'importCsv' } },
                            });
                        }
                        catch { }
                        await this.ensureStageHistory(created.id, stage);
                        results.created++;
                    }
                }
                else {
                    const created = await this.prisma.lead.create({
                        data: {
                            firstName,
                            lastName,
                            phone,
                            tag,
                            source,
                            opportunityValue,
                            saleValue: stage === 'WON' ? (opportunityValue ?? 0) : undefined,
                            stage,
                            setterId: setter ? setter.id : undefined,
                            closerId: closer ? closer.id : undefined,
                        },
                    });
                    try {
                        await this.prisma.leadEvent?.create?.({
                            data: { leadId: created.id, type: 'LEAD_CREATED', occurredAt: created.createdAt, meta: { source: 'importCsv' } },
                        });
                    }
                    catch { }
                    await this.ensureStageHistory(created.id, stage);
                    results.created++;
                }
            }
            catch {
                results.errors++;
            }
        }
        return { ok: true, ...results };
    }
    splitCsvLine(line, expectedCols) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch === ',' && !inQuotes) {
                out.push(cur);
                cur = '';
            }
            else {
                cur += ch;
            }
        }
        out.push(cur);
        while (out.length < expectedCols)
            out.push('');
        return out;
    }
    parseNum(v) {
        if (!v)
            return null;
        const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
        if (!Number.isFinite(n) || n < 0)
            throw new common_1.BadRequestException('opportunityValue doit être >= 0');
        return n;
    }
    safeStage(s) {
        const allowed = [
            'LEADS_RECEIVED',
            'CALL_REQUESTED',
            'CALL_ATTEMPT',
            'CALL_ANSWERED',
            'SETTER_NO_SHOW',
            'FOLLOW_UP',
            'RV0_PLANNED',
            'RV0_HONORED',
            'RV0_NO_SHOW',
            'RV1_PLANNED',
            'RV1_HONORED',
            'RV1_NO_SHOW',
            'RV1_POSTPONED',
            'RV2_PLANNED',
            'RV2_HONORED',
            'RV2_POSTPONED',
            'NOT_QUALIFIED',
            'LOST',
            'WON',
        ];
        const up = String(s).toUpperCase();
        return allowed.includes(up) ? up : 'LEADS_RECEIVED';
    }
    async getMetricsConfig() {
        let rows = await this.prisma.metricConfig.findMany({ orderBy: { order: 'asc' } });
        if (!rows.length) {
            await this.prisma.$transaction(DEFAULT_METRICS.map((m) => this.prisma.metricConfig.create({
                data: {
                    key: m.key,
                    label: m.label,
                    sourcePath: m.sourcePath,
                    order: m.order,
                    enabled: m.enabled,
                },
            })));
            rows = await this.prisma.metricConfig.findMany({ orderBy: { order: 'asc' } });
        }
        return { ok: true, metrics: rows };
    }
    async putMetricsConfig(payload) {
        if (!Array.isArray(payload))
            throw new common_1.BadRequestException('Payload invalide');
        await this.prisma.$transaction(payload.map((m, idx) => this.prisma.metricConfig.upsert({
            where: { key: m.key },
            update: {
                label: m.label ?? undefined,
                sourcePath: m.sourcePath ?? undefined,
                order: typeof m.order === 'number' ? m.order : idx,
                enabled: typeof m.enabled === 'boolean' ? m.enabled : undefined,
            },
            create: {
                key: m.key,
                label: m.label ??
                    DEFAULT_METRICS.find((x) => x.key === m.key)?.label ??
                    m.key,
                sourcePath: m.sourcePath ??
                    DEFAULT_METRICS.find((x) => x.key === m.key)?.sourcePath ??
                    'funnel.totals.leads',
                order: typeof m.order === 'number' ? m.order : idx,
                enabled: typeof m.enabled === 'boolean' ? m.enabled : true,
            },
        })));
        return this.getMetricsConfig();
    }
    async resetMetricsConfig() {
        await this.prisma.metricConfig.deleteMany({});
        await this.prisma.$transaction(DEFAULT_METRICS.map((m) => this.prisma.metricConfig.create({
            data: {
                key: m.key,
                label: m.label,
                sourcePath: m.sourcePath,
                order: m.order,
                enabled: m.enabled,
            },
        })));
        return this.getMetricsConfig();
    }
    async addEvent(leadId, body) {
        const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
        const meta = { ...body, source: 'api' };
        const ev = await this.prisma.leadEvent?.create?.({
            data: { leadId, type: body.type, occurredAt, meta },
        });
        if (body.type === 'STAGE_ENTERED' && body.stage) {
            const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
            if (!lead)
                throw new common_1.NotFoundException('Lead introuvable');
            const stageDto = typeof body.stage === 'string' ? ((0, create_prospect_event_dto_1.normalizeStage)(body.stage) || body.stage) : body.stage;
            if (!stageDto)
                throw new common_1.BadRequestException('Stage invalide');
            const toStage = mapStageDtoToLeadStage(stageDto);
            await this.updateLeadStage(leadId, toStage, 'api');
        }
        return { ok: true, event: ev ?? null };
    }
};
exports.ProspectsService = ProspectsService;
exports.ProspectsService = ProspectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reporting_service_1.ReportingService,
        stage_events_service_1.StageEventsService])
], ProspectsService);
//# sourceMappingURL=prospects.service.js.map