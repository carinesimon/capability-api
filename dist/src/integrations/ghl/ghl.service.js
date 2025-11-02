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
function mapStageNameToLeadStage(name) {
    if (!name)
        return undefined;
    const n = name.toLowerCase().trim();
    if (['prospect', 'prospects', 'nouveau', 'new'].some(x => n.includes(x)))
        return 'LEADS_RECEIVED';
    if (n.includes('rv0'))
        return 'RV0_PLANNED';
    if (n.includes('rv1'))
        return 'RV1_PLANNED';
    if (n.includes('rv2') || n.includes('follow'))
        return 'RV2_PLANNED';
    if (n.includes('won') || n.includes('gagn'))
        return 'WON';
    if (n.includes('lost') || n.includes('perdu'))
        return 'LOST';
    if (n.includes('not') && n.includes('qual'))
        return 'NOT_QUALIFIED';
    return undefined;
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
            return;
        await this.prisma.webhookEvent.upsert({
            where: { externalId: eventId },
            update: { status: 'RECEIVED', receivedAt: new Date(), type: 'ghl', payloadHash: eventId },
            create: { externalId: eventId, status: 'RECEIVED', receivedAt: new Date(), type: 'ghl', payloadHash: eventId },
        });
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
        const lead = (args.ghlContactId
            ? await this.prisma.lead.findFirst({ where: { ghlContactId: args.ghlContactId } })
            : null) ||
            (args.contactEmail
                ? await this.prisma.lead.findFirst({ where: { email: (args.contactEmail || '').toLowerCase() } })
                : null);
        const mapped = mapStageNameToLeadStage(args.stage || undefined);
        if (!lead) {
            const created = await this.prisma.lead.create({
                data: {
                    firstName: 'Unknown',
                    lastName: null,
                    email: args.contactEmail?.toLowerCase() || null,
                    source: 'GHL',
                    ghlContactId: args.ghlContactId ?? null,
                    ...(mapped ? { stage: mapped, stageUpdatedAt: new Date() } : {}),
                    ...(mapped === 'WON' && args.saleValue != null ? { saleValue: args.saleValue } : {}),
                },
            });
            if (mapped) {
                await this.stageEvents.recordStageEntry({
                    leadId: created.id,
                    fromStage: 'LEADS_RECEIVED',
                    toStage: mapped,
                    source: 'webhook:ghl:opportunity',
                    externalId: args.ghlContactId ?? args.contactEmail ?? undefined,
                });
            }
            return created;
        }
        const update = {};
        if (mapped) {
            update.stage = mapped;
            update.stageUpdatedAt = new Date();
            if (mapped === 'WON' && args.saleValue != null)
                update.saleValue = args.saleValue;
            await this.stageEvents.recordStageEntry({
                leadId: lead.id,
                fromStage: lead.stage ?? 'LEADS_RECEIVED',
                toStage: mapped,
                source: 'webhook:ghl:opportunity',
                externalId: args.ghlContactId ?? args.contactEmail ?? undefined,
            });
        }
        if (args.ghlContactId && !lead.ghlContactId)
            update.ghlContactId = args.ghlContactId;
        if (Object.keys(update).length === 0)
            return lead;
        return this.prisma.lead.update({ where: { id: lead.id }, data: update });
    }
    async upsertAppointment(args) {
        const lead = (args.ghlContactId
            ? await this.prisma.lead.findFirst({ where: { ghlContactId: args.ghlContactId } })
            : null) ||
            (args.contactEmail
                ? await this.prisma.lead.findFirst({ where: { email: (args.contactEmail || '').toLowerCase() } })
                : null);
        const leadId = lead?.id ?? null;
        const user = args.ownerEmail
            ? await this.prisma.user.findFirst({ where: { email: args.ownerEmail.toLowerCase() } })
            : null;
        try {
            const scheduledAt = args.startTime ? new Date(args.startTime) : new Date();
            const type = (args.type || '').toUpperCase();
            const status = (args.status || '').toUpperCase();
            const appt = args.id
                ? await this.prisma.appointment.upsert({
                    where: { id: args.id },
                    update: {
                        type,
                        status,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                    create: {
                        id: args.id,
                        type,
                        status,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                })
                : await this.prisma.appointment.create({
                    data: {
                        type,
                        status,
                        scheduledAt,
                        ...(leadId ? { leadId } : {}),
                        ...(user?.id ? { userId: user.id } : {}),
                    },
                });
            if (leadId) {
                const toStage = (() => {
                    if (type === 'RV1' && status === 'HONORED')
                        return 'RV1_HONORED';
                    if (type === 'RV1')
                        return 'RV1_PLANNED';
                    if (type === 'RV0' && status === 'HONORED')
                        return 'RV0_HONORED';
                    if (type === 'RV0')
                        return 'RV0_PLANNED';
                    if (type === 'RV2' && status === 'HONORED')
                        return 'RV2_HONORED';
                    if (type === 'RV2')
                        return 'RV2_PLANNED';
                    return null;
                })();
                if (toStage) {
                    await this.stageEvents.recordStageEntry({
                        leadId,
                        fromStage: lead?.stage ?? 'LEADS_RECEIVED',
                        toStage: toStage,
                        source: 'webhook:ghl:appointment',
                        externalId: args.id ?? undefined,
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
        }
        return lead;
    }
};
exports.GhlService = GhlService;
exports.GhlService = GhlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stage_events_service_1.StageEventsService])
], GhlService);
//# sourceMappingURL=ghl.service.js.map
