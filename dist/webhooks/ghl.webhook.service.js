"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlWebhookService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function mapGhlStageToLeadStage(name) {
    if (!name)
        return undefined;
    const n = name.toLowerCase();
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
    if (n.includes('new') || n.includes('prospect'))
        return 'LEADS_RECEIVED';
    return undefined;
}
let GhlWebhookService = class GhlWebhookService {
    async verifySignature(_raw, _signature) {
        return true;
    }
    async handleContact(payload) {
        const contact = payload?.contact || payload?.data || payload;
        if (!contact)
            throw new common_1.BadRequestException('No contact in payload');
        const ghlContactId = contact.id || contact.contactId || contact.contact_id || null;
        const email = (contact.email || '').trim().toLowerCase() || null;
        const phone = contact.phone || contact.phoneNumber || null;
        const firstName = contact.firstName || contact.first_name || contact.first_name__c || 'Unknown';
        const lastName = contact.lastName || contact.last_name || null;
        const tag = (Array.isArray(contact.tags) ? contact.tags[0] : contact.tag) || null;
        const source = contact.source || contact.utm_source || 'GHL';
        const where = ghlContactId ? { ghlContactId } :
            email ? { email } :
                { id: '__no_unique__' };
        const dataCreate = {
            firstName, lastName, email, phone, tag,
            source: source || 'GHL',
            ghlContactId,
            stage: 'LEADS_RECEIVED',
            opportunityValue: 5000,
        };
        const dataUpdate = {
            firstName, lastName, email, phone, tag, source,
            ...(ghlContactId ? { ghlContactId } : {}),
        };
        const lead = await prisma.lead.upsert({
            where: where,
            create: dataCreate,
            update: dataUpdate,
        }).catch(async () => prisma.lead.create({ data: dataCreate }));
        try {
            await prisma.leadEvent?.create?.({
                data: { leadId: lead.id, type: 'LEAD_CREATED', meta: { ghlContactId, payload } },
            });
        }
        catch { }
        return { ok: true, leadId: lead.id };
    }
    async handleOpportunity(payload) {
        const opp = payload?.opportunity || payload?.data || payload;
        if (!opp)
            throw new common_1.BadRequestException('No opportunity in payload');
        const ghlContactId = opp.contactId || opp.contact_id || opp.contact?.id || null;
        const stageName = opp.stage || opp.stageName || opp.stage_name;
        const mapped = mapGhlStageToLeadStage(stageName);
        const email = (opp.contact?.email || '').toLowerCase();
        let lead = (ghlContactId ? await prisma.lead.findFirst({ where: { ghlContactId } }) : null) ||
            (email ? await prisma.lead.findFirst({ where: { email } }) : null);
        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    firstName: opp.contact?.firstName || 'Unknown',
                    lastName: opp.contact?.lastName || null,
                    email: email || null,
                    phone: opp.contact?.phone || null,
                    ghlContactId,
                    source: 'GHL',
                    stage: 'LEADS_RECEIVED',
                },
            });
        }
        if (mapped) {
            await prisma.lead.update({
                where: { id: lead.id },
                data: { stage: mapped, stageUpdatedAt: new Date() },
            });
            try {
                await prisma.leadEvent?.create?.({
                    data: { leadId: lead.id, type: mapped === 'WON' ? 'WON' : 'STAGE_CHANGED', meta: { from: 'GHL', rawStage: stageName } },
                });
            }
            catch { }
        }
        return { ok: true, leadId: lead.id };
    }
    async handleAppointment(payload) {
        const appt = payload?.appointment || payload?.data || payload;
        const ghlContactId = appt?.contactId || appt?.contact_id || appt?.contact?.id;
        if (!ghlContactId)
            return { ok: true };
        const lead = await prisma.lead.findFirst({ where: { ghlContactId } });
        if (!lead)
            return { ok: true };
        const type = (appt.type || '').toUpperCase();
        const status = (appt.status || '').toUpperCase();
        const map = {
            'RV0:PLANNED': 'APPOINTMENT_PLANNED_RV0',
            'RV0:HONORED': 'APPOINTMENT_HONORED_RV0',
            'RV0:NO_SHOW': 'APPOINTMENT_NOSHOW_RV0',
            'RV1:PLANNED': 'APPOINTMENT_PLANNED_RV1',
            'RV1:HONORED': 'APPOINTMENT_HONORED_RV1',
            'RV1:NO_SHOW': 'APPOINTMENT_NOSHOW_RV1',
            'RV2:PLANNED': 'APPOINTMENT_PLANNED_RV2',
            'RV2:HONORED': 'APPOINTMENT_HONORED_RV2',
            'RV2:NO_SHOW': 'APPOINTMENT_NOSHOW_RV2',
        };
        const ev = map[`${type}:${status}`];
        if (!ev)
            return { ok: true };
        try {
            await prisma.leadEvent?.create?.({
                data: { leadId: lead.id, type: ev, meta: { payload } },
            });
        }
        catch { }
        return { ok: true };
    }
    async handleCall(payload) {
        const call = payload?.call || payload?.data || payload;
        const ghlContactId = call?.contactId || call?.contact_id;
        if (!ghlContactId)
            return { ok: true };
        const lead = await prisma.lead.findFirst({ where: { ghlContactId } });
        if (!lead)
            return { ok: true };
        const answered = !!call?.answered;
        try {
            await prisma.leadEvent?.create?.({
                data: { leadId: lead.id, type: answered ? 'CALL_ANSWERED' : 'CALL_ATTEMPT', meta: { payload } },
            });
        }
        catch { }
        return { ok: true };
    }
};
exports.GhlWebhookService = GhlWebhookService;
exports.GhlWebhookService = GhlWebhookService = __decorate([
    (0, common_1.Injectable)()
], GhlWebhookService);
//# sourceMappingURL=ghl.webhook.service.js.map