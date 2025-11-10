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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const attribution_service_1 = require("../attribution/attribution.service");
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
let WebhooksService = class WebhooksService {
    prisma;
    attribution;
    constructor(prisma, attribution) {
        this.prisma = prisma;
        this.attribution = attribution;
    }
    verifySignature(rawBody, signature) {
        const secret = process.env.GHL_WEBHOOK_SECRET || '';
        if (!secret)
            return;
        if (!signature)
            throw new common_1.UnauthorizedException('Missing signature');
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        if (expected !== signature)
            throw new common_1.UnauthorizedException('Invalid signature');
    }
    hashPayload(obj) {
        return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
    }
    externalIdFrom(body) {
        const id = body?.id || body?.eventId || body?.payload?.id;
        if (id)
            return String(id);
        const base = `${body?.type || body?.event || 'unknown'}:${body?.timestamp || Date.now()}:${body?.payload?.email || ''}`;
        return crypto.createHash('sha256').update(base).digest('hex');
    }
    getByPath(obj, path) {
        if (!obj || !path)
            return undefined;
        try {
            return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
        }
        catch {
            return undefined;
        }
    }
    normEmail(v) {
        const s = String(v || '').trim().toLowerCase();
        return s.includes('@') ? s : null;
    }
    async findUserByEmailInsensitive(email) {
        const e = this.normEmail(email);
        if (!e)
            return null;
        return this.prisma.user.findFirst({
            where: { email: { equals: e, mode: 'insensitive' }, isActive: true },
            select: { id: true, role: true, firstName: true, lastName: true, email: true },
        });
    }
    async findUserByNameApprox(q, role) {
        const s = String(q || '').trim();
        if (!s)
            return null;
        return this.prisma.user.findFirst({
            where: {
                isActive: true,
                ...(role ? { role } : {}),
                OR: [
                    { firstName: { contains: s, mode: 'insensitive' } },
                    { lastName: { contains: s, mode: 'insensitive' } },
                ],
            },
            select: { id: true, role: true, firstName: true, lastName: true, email: true },
        });
    }
    async pickNextActiveSetter() {
        const setters = await this.prisma.user.findMany({
            where: { isActive: true, role: 'SETTER' },
            orderBy: { firstName: 'asc' },
            select: { id: true },
        });
        if (!setters.length)
            return null;
        const st = await this.prisma.setting.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1 },
            select: { lastSetterId: true },
        });
        const idx = Math.max(0, setters.findIndex(u => u.id === st.lastSetterId));
        const next = setters[(idx + 1) % setters.length];
        if (next?.id !== st.lastSetterId) {
            await this.prisma.setting.update({
                where: { id: 1 },
                data: { lastSetterId: next.id },
            });
        }
        return next;
    }
    async resolveAssignmentFromMapping(payload, mapping) {
        const out = {};
        const assign = mapping?.assign || {};
        const rules = Array.isArray(assign?.rules) ? assign.rules : [];
        const put = (role, id) => {
            if (!id)
                return;
            if (role === 'SETTER')
                out.setterId = id;
            if (role === 'CLOSER')
                out.closerId = id;
        };
        for (const r of rules) {
            const role = (r?.role === 'CLOSER' ? 'CLOSER' : 'SETTER');
            const mode = (r?.by || 'email');
            if (mode === 'email') {
                const raw = this.getByPath(payload, r.from);
                const email = this.normEmail(raw);
                if (!email)
                    continue;
                const u = await this.findUserByEmailInsensitive(email);
                if (u && u.role === role) {
                    put(role, u.id);
                    continue;
                }
            }
            if (mode === 'name') {
                const name = String(this.getByPath(payload, r.from) || '').trim();
                if (!name)
                    continue;
                const u = await this.findUserByNameApprox(name, role);
                if (u?.id) {
                    put(role, u.id);
                    continue;
                }
            }
            if (mode === 'static') {
                const val = String(this.getByPath(payload, r.from) ?? '').trim();
                const { equals, contains, regex } = r.match || {};
                let ok = false;
                if (equals != null)
                    ok ||= val.toLowerCase() === String(equals).toLowerCase();
                if (contains != null)
                    ok ||= val.toLowerCase().includes(String(contains).toLowerCase());
                if (regex) {
                    try {
                        ok ||= new RegExp(regex, 'i').test(val);
                    }
                    catch { }
                }
                if (ok && r.userId) {
                    put(role, r.userId);
                    continue;
                }
            }
        }
        if (!out.setterId && assign?.roundRobin?.setter) {
            const next = await this.pickNextActiveSetter();
            if (next)
                out.setterId = next.id;
        }
        return out;
    }
    async ingestLead(payload) {
        const safeEmail = payload.email && String(payload.email).includes('@')
            ? String(payload.email).trim().toLowerCase()
            : null;
        const createData = {
            firstName: payload.firstName,
            lastName: payload.lastName ?? null,
            email: safeEmail,
            phone: payload.phone ?? null,
            tag: payload.tag ?? null,
            source: 'GHL',
            ghlContactId: payload.ghlContactId ?? null,
            opportunityValue: Number.isFinite(payload.opportunityValue)
                ? Number(payload.opportunityValue)
                : 5000,
        };
        const lead = await this.prisma.lead.upsert({
            where: safeEmail
                ? { email: safeEmail }
                : { ghlContactId: payload.ghlContactId ?? crypto.randomUUID() },
            update: {
                firstName: payload.firstName,
                lastName: payload.lastName ?? undefined,
                phone: payload.phone ?? undefined,
                tag: payload.tag ?? undefined,
                source: 'GHL',
                ghlContactId: payload.ghlContactId ?? undefined,
                ...(Number.isFinite(payload.opportunityValue)
                    ? { opportunityValue: Number(payload.opportunityValue) }
                    : {}),
            },
            create: createData,
        });
        const mapping = payload.__mappingJson ?? undefined;
        const assign = await this.resolveAssignmentFromMapping(payload.__rawPayload ?? payload, mapping);
        if (assign.setterId || assign.closerId) {
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: {
                    ...(assign.setterId ? { setterId: assign.setterId } : {}),
                    ...(assign.closerId ? { closerId: assign.closerId } : {}),
                },
            });
        }
        else {
            if (!lead.setterId) {
                await this.attribution.ensureSetter(lead.id);
            }
        }
        return this.prisma.lead.findUnique({ where: { id: lead.id }, include: { setter: true, closer: true } });
    }
    toAppointmentType(v) {
        const s = String(v || 'RV1').toUpperCase();
        if (s.includes('RV0'))
            return client_1.AppointmentType.RV0;
        if (s.includes('RV2'))
            return client_1.AppointmentType.RV2;
        return client_1.AppointmentType.RV1;
    }
    toAppointmentStatus(v) {
        const s = String(v || 'HONORED').toUpperCase().replace('-', '_').replace(' ', '_');
        if (s.includes('REPORT') || s.includes('POST'))
            return client_1.AppointmentStatus.POSTPONED;
        if (s.includes('ANNUL') || s.includes('CANCEL'))
            return client_1.AppointmentStatus.CANCELED;
        if (s.includes('NO') && s.includes('SHOW'))
            return client_1.AppointmentStatus.NO_SHOW;
        if (s.includes('NON') && s.includes('QUAL'))
            return client_1.AppointmentStatus.NOT_QUALIFIED;
        return client_1.AppointmentStatus.HONORED;
    }
    async onAppointmentUpsert(body) {
        const leadEmail = body?.payload?.leadEmail || body?.payload?.contact?.email || body?.leadEmail || null;
        let lead = null;
        if (leadEmail) {
            lead = await this.prisma.lead.findFirst({ where: { email: String(leadEmail) } });
        }
        if (!lead && body?.payload?.ghlContactId) {
            lead = await this.prisma.lead.findFirst({
                where: { ghlContactId: String(body.payload.ghlContactId) },
            });
        }
        if (!lead)
            return;
        const ownerEmail = body?.payload?.ownerEmail || body?.payload?.user?.email || body?.ownerEmail || null;
        let user = null;
        if (ownerEmail) {
            user = await this.prisma.user.findFirst({ where: { email: String(ownerEmail) } });
        }
        const mapping = body.__mappingJson ?? undefined;
        const assign = await this.resolveAssignmentFromMapping(body, mapping);
        if (assign.closerId || assign.setterId) {
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: {
                    ...(assign.setterId ? { setterId: assign.setterId } : {}),
                    ...(assign.closerId ? { closerId: assign.closerId } : {}),
                },
            });
        }
        const type = this.toAppointmentType(body?.payload?.type);
        const status = this.toAppointmentStatus(body?.payload?.status);
        const iso = body?.payload?.scheduledAt || body?.payload?.startTime || new Date().toISOString();
        await this.prisma.appointment.create({
            data: {
                type,
                status,
                scheduledAt: new Date(iso),
                lead: { connect: { id: lead.id } },
                ...(user ? { user: { connect: { id: user.id } } } : {}),
            },
        });
        if (type === client_1.AppointmentType.RV0 || type === client_1.AppointmentType.RV1 || type === client_1.AppointmentType.RV2) {
            const next = type === client_1.AppointmentType.RV0 ? client_1.LeadStage.RV0_PLANNED :
                type === client_1.AppointmentType.RV1 ? client_1.LeadStage.RV1_PLANNED :
                    client_1.LeadStage.RV2_PLANNED;
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: {
                    stage: next,
                    stageUpdatedAt: new Date(),
                    ...(user && user.role === client_1.Role.CLOSER ? { closerId: user.id } : {}),
                },
            });
        }
    }
    async findUserByEmail(email) {
        if (!email)
            return null;
        const e = String(email).trim().toLowerCase();
        if (!e.includes("@"))
            return null;
        return this.prisma.user.findFirst({
            where: { email: { equals: e, mode: 'insensitive' }, isActive: true },
            select: { id: true, role: true, firstName: true, email: true },
        });
    }
    async resolveAssignmentFromPayload(payload) {
        const ownerEmail = payload?.payload?.ownerEmail ||
            payload?.payload?.user?.email ||
            payload?.ownerEmail ||
            payload?.user?.email ||
            null;
        const closerEmail = payload?.payload?.closerEmail ||
            payload?.closerEmail ||
            null;
        let setterId;
        let closerId;
        const owner = await this.findUserByEmail(ownerEmail);
        if (owner?.role === 'SETTER')
            setterId = owner.id;
        if (owner?.role === 'CLOSER')
            closerId = owner.id;
        const closer = await this.findUserByEmail(closerEmail);
        if (closer?.role === 'CLOSER')
            closerId = closer.id;
        if (!setterId) {
            const next = await this.pickNextActiveSetter();
            if (next)
                setterId = next.id;
        }
        return { setterId, closerId };
    }
    async handleGhlWebhook(rawBody, headers, body) {
        const sig = (headers['x-ghl-signature'] || headers['X-GHL-Signature']);
        this.verifySignature(rawBody, sig);
        const type = String(body?.type || body?.event || 'unknown');
        const externalId = this.externalIdFrom(body);
        const payloadHash = this.hashPayload(body);
        const existing = await this.prisma.webhookEvent.findUnique({ where: { externalId } });
        if (existing && existing.payloadHash === payloadHash) {
            await this.prisma.webhookEvent.upsert({
                where: { externalId },
                update: { status: 'DUPLICATE' },
                create: { externalId, type, payloadHash, status: 'DUPLICATE' },
            });
            return { ok: true, duplicate: true };
        }
        await this.prisma.webhookEvent.upsert({
            where: { externalId },
            update: { type, payloadHash, status: 'RECEIVED' },
            create: { externalId, type, payloadHash, status: 'RECEIVED' },
        });
        try {
            if (type === 'lead.created' || type === 'contact.created') {
                await this.ingestLead({
                    firstName: body?.payload?.firstName || body?.payload?.contact?.firstName || 'Unknown',
                    lastName: body?.payload?.lastName || body?.payload?.contact?.lastName || null,
                    email: body?.payload?.email || body?.payload?.contact?.email || null,
                    phone: body?.payload?.phone || body?.payload?.contact?.phone || null,
                    tag: body?.payload?.tag || body?.payload?.source || 'GHL',
                    ghlContactId: body?.payload?.id || body?.payload?.contactId || null,
                    opportunityValue: body?.payload?.opportunityValue ?? null,
                    ...(body ? { __rawPayload: body } : {}),
                });
            }
            else if (type === 'appointment.created' || type === 'appointment.updated') {
                await this.onAppointmentUpsert(body);
            }
            await this.prisma.webhookEvent.update({
                where: { externalId },
                data: { status: 'PROCESSED', processedAt: new Date() },
            });
            return { ok: true };
        }
        catch (err) {
            await this.prisma.webhookEvent.update({
                where: { externalId },
                data: { status: 'ERROR', error: err?.message ?? String(err) },
            });
            throw err;
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        attribution_service_1.AttributionService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map