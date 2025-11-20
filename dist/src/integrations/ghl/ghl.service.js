"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const qs = __importStar(require("querystring"));
const client_1 = require("@prisma/client");
const stage_events_service_1 = require("../../modules/leads/stage-events.service");
function ensureDir(dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
const DATA_DIR = path.resolve(process.cwd(), '.data', 'webhooks');
function safeJsonParse(s) {
    try {
        return JSON.parse(s);
    }
    catch {
        return null;
    }
}
function smartParse(raw, contentType) {
    const ct = (contentType || '').toLowerCase();
    if (ct.includes('application/json')) {
        const j = safeJsonParse(raw);
        if (j)
            return j;
    }
    if (ct.includes('application/x-www-form-urlencoded') || raw.includes('=')) {
        const obj = qs.parse(raw);
        const flattened = {};
        for (const [k, v] of Object.entries(obj)) {
            const key = k.replace(/\]/g, '').replace(/\[/g, '.');
            flattened[key] = Array.isArray(v) ? v[0] : v;
        }
        return flattened;
    }
    return safeJsonParse(raw) ?? { text: raw };
}
function getByPath(obj, p) {
    if (!obj || !p)
        return undefined;
    return p.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}
function normalizeKey(input) {
    if (!input)
        return '';
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}
const STAGE_ALIASES = {
    LEAD_RECU: 'LEADS_RECEIVED',
    LEAD_REÇU: 'LEADS_RECEIVED',
    LEADS_RECEIVED: 'LEADS_RECEIVED',
    DEMANDE_APPEL: 'CALL_REQUESTED',
    CALL_REQUESTED: 'CALL_REQUESTED',
    APPEL_PASSE: 'CALL_ATTEMPT',
    CALL_ATTEMPT: 'CALL_ATTEMPT',
    APPEL_REPONDU: 'CALL_ANSWERED',
    CALL_ANSWERED: 'CALL_ANSWERED',
    NO_SHOW_SETTER: 'SETTER_NO_SHOW',
    SETTER_NO_SHOW: 'SETTER_NO_SHOW',
    RV0_PLANIFIE: 'RV0_PLANNED',
    RV0_PLANIFIÉ: 'RV0_PLANNED',
    RV0_PLANNED: 'RV0_PLANNED',
    RV0_HONORE: 'RV0_HONORED',
    RV0_HONORÉ: 'RV0_HONORED',
    RV0_HONORED: 'RV0_HONORED',
    RV0_NO_SHOW: 'RV0_NO_SHOW',
    RV0_CANCELED: 'RV0_CANCELED',
    RV0_CANCELLED: 'RV0_CANCELLED',
    RV1_PLANIFIE: 'RV1_PLANNED',
    RV1_PLANIFIÉ: 'RV1_PLANNED',
    RV1_PLANNED: 'RV1_PLANNED',
    RV1_HONORE: 'RV1_HONORED',
    RV1_HONORÉ: 'RV1_HONORED',
    RV1_HONORED: 'RV1_HONORED',
    RV1_NO_SHOW: 'RV1_NO_SHOW',
    RV1_CANCELED: 'RV1_CANCELED',
    RV1_CANCELLED: 'RV1_CANCELLED',
    RV2_PLANIFIE: 'RV2_PLANNED',
    RV2_PLANIFIÉ: 'RV2_PLANNED',
    RV2_PLANNED: 'RV2_PLANNED',
    RV2_HONORE: 'RV2_HONORED',
    RV2_HONORÉ: 'RV2_HONORED',
    RV2_HONORED: 'RV2_HONORED',
    RV2_POSTPONED: 'RV2_POSTPONED',
    RV2_CANCELED: 'RV2_CANCELED',
    RV2_CANCELLED: 'RV0_CANCELLED',
    NON_QUALIFIE: 'NOT_QUALIFIED',
    NON_QUALIFIÉ: 'NOT_QUALIFIED',
    NOT_QUALIFIED: 'NOT_QUALIFIED',
    PERDU: 'LOST',
    LOST: 'LOST',
    WON: 'WON',
};
function resolveStageKey(input) {
    if (!input)
        return undefined;
    if (Object.values(client_1.LeadStage).includes(input))
        return input;
    const norm = normalizeKey(String(input));
    const mapped = STAGE_ALIASES[norm] || norm;
    if (Object.values(client_1.LeadStage).includes(mapped))
        return mapped;
    return mapped;
}
function mapStageNameToLeadStage(name) {
    const key = resolveStageKey(name);
    return Object.values(client_1.LeadStage).includes(key) ? key : undefined;
}
function mapAppointmentToStage(type, status) {
    const t = normalizeKey(type || '');
    const s = normalizeKey(status || '');
    if (s === 'SCHEDULED' || s === 'PLANNED' || s === 'BOOKED' || s === '') {
        if (t === 'RV2')
            return 'RV2_PLANNED';
        if (t === 'RV1')
            return 'RV1_PLANNED';
        if (t === 'RV0')
            return 'RV0_PLANNED';
    }
    if (s === 'SHOW' || s === 'HONORED' || s === 'COMPLETED' || s === 'DONE') {
        if (t === 'RV2')
            return 'RV2_HONORED';
        if (t === 'RV1')
            return 'RV1_HONORED';
        if (t === 'RV0')
            return 'RV0_HONORED';
    }
    if (s === 'NO_SHOW' || s === 'NOSHOW') {
        if (t === 'RV1')
            return 'RV1_NO_SHOW';
        if (t === 'RV0')
            return 'RV0_NO_SHOW';
    }
    if (s === 'RESCHEDULED' || s === 'POSTPONED') {
        if (t === 'RV2')
            return 'RV2_POSTPONED';
        if (t === 'RV1')
            return 'RV1_PLANNED';
        if (t === 'RV0')
            return 'RV0_PLANNED';
    }
    if (s === 'CANCELED' || s === 'CANCELLED') {
        if (t === 'RV0')
            return 'RV0_CANCELED';
        if (t === 'RV1')
            return 'RV1_CANCELED';
        if (t === 'RV2')
            return 'RV2_CANCELED';
    }
    if (t === 'RV2')
        return 'RV2_PLANNED';
    if (t === 'RV1')
        return 'RV1_PLANNED';
    if (t === 'RV0')
        return 'RV0_PLANNED';
    return null;
}
let GhlService = class GhlService {
    prisma;
    stageEvents;
    constructor(prisma, stageEvents) {
        this.prisma = prisma;
        this.stageEvents = stageEvents;
    }
    async deduplicate(eventId) {
        if (!eventId)
            return true;
        try {
            await this.prisma.webhookEvent.create({
                data: {
                    externalId: eventId,
                    status: 'RECEIVED',
                    type: 'ghl',
                    payloadHash: eventId,
                    receivedAt: new Date(),
                },
            });
            return true;
        }
        catch {
            await this.prisma.webhookEvent.updateMany({
                where: { externalId: eventId },
                data: { status: 'RECEIVED', receivedAt: new Date() },
            });
            return false;
        }
    }
    async upsertContact(args) {
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
    async upsertOpportunity(args) {
        const lead = await this.findLeadByEmailOrGhlId((args.contactEmail || '').toLowerCase() || null, args.ghlContactId || null);
        const mapped = resolveStageKey(args.stage || undefined);
        if (!lead) {
            const created = await this.prisma.lead.create({
                data: {
                    firstName: 'Unknown',
                    lastName: null,
                    email: args.contactEmail?.toLowerCase() || null,
                    source: 'GHL',
                    ghlContactId: args.ghlContactId ?? null,
                    ...(mapped && Object.values(client_1.LeadStage).includes(mapped)
                        ? { stage: mapped, stageUpdatedAt: new Date() }
                        : {}),
                    ...(mapped === 'WON' && args.saleValue != null ? { saleValue: args.saleValue } : {}),
                },
            });
            if (mapped) {
                await this.safeRecordStageEntry({
                    leadId: created.id,
                    toStage: mapped,
                    fromStage: 'LEADS_RECEIVED',
                    source: 'webhook:ghl:opportunity',
                    externalId: args.eventId ?? args.ghlContactId ?? args.contactEmail ?? undefined,
                });
            }
            return created;
        }
        const update = {};
        if (mapped) {
            if (Object.values(client_1.LeadStage).includes(mapped)) {
                update.stage = mapped;
                update.stageUpdatedAt = new Date();
                if (mapped === 'WON' && args.saleValue != null)
                    update.saleValue = args.saleValue;
                await this.safeRecordStageEntry({
                    leadId: lead.id,
                    fromStage: lead.stage ?? 'LEADS_RECEIVED',
                    toStage: mapped,
                    source: 'webhook:ghl:opportunity',
                    externalId: args.eventId ?? args.ghlContactId ?? args.contactEmail ?? undefined,
                });
            }
        }
        if (args.ghlContactId && !lead.ghlContactId)
            update.ghlContactId = args.ghlContactId;
        if (Object.keys(update).length === 0)
            return lead;
        return this.prisma.lead.update({ where: { id: lead.id }, data: update });
    }
    async upsertAppointment(args) {
        const lead = await this.findLeadByEmailOrGhlId((args.contactEmail || '').toLowerCase() || null, args.ghlContactId || null);
        const leadId = lead?.id ?? null;
        const user = args.ownerEmail
            ? await this.prisma.user.findFirst({ where: { email: args.ownerEmail.toLowerCase() } })
            : null;
        try {
            const scheduledAt = args.startTime ? new Date(args.startTime) : new Date();
            const typeNorm = normalizeKey(args.type || '');
            const statusNorm = normalizeKey(args.status || '');
            const appt = args.id
                ? await this.prisma.appointment.upsert({
                    where: { id: args.id },
                    update: {
                        type: typeNorm,
                        status: statusNorm,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                    create: {
                        id: args.id,
                        type: typeNorm,
                        status: statusNorm,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                })
                : await this.prisma.appointment.create({
                    data: {
                        type: typeNorm,
                        status: statusNorm,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                });
            if (leadId) {
                const toStage = mapAppointmentToStage(args.type, args.status);
                if (toStage) {
                    await this.safeRecordStageEntry({
                        leadId,
                        fromStage: lead?.stage ?? 'LEADS_RECEIVED',
                        toStage,
                        source: 'webhook:ghl:appointment',
                        externalId: args.eventId ?? args.id ?? undefined,
                    });
                    await this.prisma.lead.update({
                        where: { id: leadId },
                        data: { stage: toStage, stageUpdatedAt: new Date(), boardColumnKey: null },
                    });
                }
            }
            return appt;
        }
        catch {
            return { ok: true };
        }
    }
    async captureInbox(args) {
        ensureDir(DATA_DIR);
        const id = crypto.randomUUID();
        const hash = crypto.createHash('sha256').update(args.raw || '').digest('hex');
        const parsed = smartParse(args.raw || '', args.contentType || '');
        const item = {
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
        const out = [];
        for (const f of files.slice(0, limit)) {
            const j = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
            out.push({ id: j.id, receivedAt: j.receivedAt, contentType: j.contentType });
        }
        return { ok: true, items: out };
    }
    async getInboxItem(id) {
        const file = path.join(DATA_DIR, `${id}.json`);
        if (!fs.existsSync(file))
            throw new Error('Inbox item not found');
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    async tryAutoProcess(item) {
        const p = item.parsed || {};
        const firstName = p['contact.first_name'] ?? p['first_name'] ?? p['firstName'] ?? p['contact.name']?.split(' ')?.[0];
        const lastName = p['contact.last_name'] ?? p['last_name'] ?? p['lastName'] ?? (p['contact.name']?.split(' ')?.slice(1).join(' ') || null);
        const email = p['contact.email'] ?? p['email'] ?? null;
        const phone = p['contact.phone'] ?? p['phone'] ?? null;
        const stageName = p['opportunity.stage_name'] ?? p['stage_name'] ?? p['stageName'] ?? undefined;
        const saleValue = Number(p['opportunity.monetary_value'] ?? p['monetary_value'] ?? p['saleValue'] ?? NaN);
        const ghlContactId = p['contact.id'] ?? p['contactId'] ?? p['id'] ?? undefined;
        if (!firstName && !email && !phone)
            return;
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
    async processWithMapping(inboxId, mapping, defaults = {}) {
        const item = await this.getInboxItem(inboxId);
        const p = item.parsed || {};
        const pick = (k) => (k ? getByPath(p, k) : undefined);
        const payload = {
            ghlContactId: String(pick(mapping['ghlContactId']) ?? p['contact.id'] ?? p['contactId'] ?? ''),
            firstName: (pick(mapping['firstName']) ?? defaults.firstName ?? 'Unknown'),
            lastName: (pick(mapping['lastName']) ?? defaults.lastName ?? null),
            email: (pick(mapping['email']) ?? defaults.email ?? null),
            phone: (pick(mapping['phone']) ?? defaults.phone ?? null),
            source: (pick(mapping['source']) ?? defaults.source ?? 'GHL'),
            tag: (pick(mapping['tag']) ?? defaults.tag ?? null),
            stageName: (pick(mapping['stageName']) ?? defaults.stageName ?? undefined),
            saleValue: Number(pick(mapping['saleValue']) ?? defaults.saleValue ?? NaN),
            createdAtISO: (pick(mapping['createdAt']) ?? undefined),
        };
        if (!Number.isFinite(payload.saleValue))
            delete payload.saleValue;
        const lead = await this.upsertLead(payload);
        return { ok: true, lead };
    }
    async upsertLead(args) {
        const whereOr = [];
        if (args.ghlContactId)
            whereOr.push({ ghlContactId: args.ghlContactId });
        if (args.email)
            whereOr.push({ email: (args.email || '').toLowerCase() });
        if (args.phone)
            whereOr.push({ phone: args.phone });
        let existing = null;
        if (whereOr.length) {
            existing = await this.prisma.lead.findFirst({ where: { OR: whereOr } });
        }
        const stage = mapStageNameToLeadStage(args.stageName);
        const baseData = {
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
            if (stage) {
                await this.safeRecordStageEntry({
                    leadId: lead.id,
                    fromStage: 'LEADS_RECEIVED',
                    toStage: stage,
                    source: 'webhook:ghl:lead-upsert',
                    externalId: args.ghlContactId ?? args.email ?? undefined,
                });
            }
        }
        else {
            const update = { ...baseData };
            if (stage) {
                update.stage = stage;
                update.stageUpdatedAt = new Date();
            }
            if (args.saleValue != null && stage === 'WON')
                update.saleValue = args.saleValue;
            lead = await this.prisma.lead.update({
                where: { id: existing.id },
                data: update,
            });
            if (stage) {
                await this.safeRecordStageEntry({
                    leadId: lead.id,
                    fromStage: existing.stage ?? 'LEADS_RECEIVED',
                    toStage: stage,
                    source: 'webhook:ghl:lead-upsert',
                    externalId: args.ghlContactId ?? args.email ?? undefined,
                });
            }
        }
        return lead;
    }
    async findLeadByEmailOrGhlId(email, ghlId) {
        if (email) {
            const byEmail = await this.prisma.lead.findUnique({ where: { email } });
            if (byEmail)
                return byEmail;
        }
        if (ghlId) {
            const byGhl = await this.prisma.lead.findFirst({ where: { ghlContactId: ghlId } });
            if (byGhl)
                return byGhl;
        }
        return null;
    }
    async safeRecordStageEntry(args) {
        try {
            await this.stageEvents.recordStageEntry({
                leadId: args.leadId,
                fromStage: args.fromStage,
                toStage: args.toStage,
                source: args.source ?? 'webhook:ghl',
                externalId: args.externalId,
            });
        }
        catch {
        }
    }
};
exports.GhlService = GhlService;
exports.GhlService = GhlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stage_events_service_1.StageEventsService])
], GhlService);
//# sourceMappingURL=ghl.service.js.map