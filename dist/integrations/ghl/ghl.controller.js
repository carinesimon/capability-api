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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlController = void 0;
const common_1 = require("@nestjs/common");
const ghl_service_1 = require("./ghl.service");
let GhlController = class GhlController {
    ghl;
    constructor(ghl) {
        this.ghl = ghl;
    }
    async webhook(body) {
        const payload = body?.payload || body;
        const rawType = (body?.type || payload?.type || '').toString();
        const type = rawType.toLowerCase();
        const eventId = body?.eventId ??
            payload?.eventId ??
            payload?.id ??
            payload?.appointmentId ??
            payload?.opportunityId ??
            undefined;
        const fresh = await this.ghl.deduplicate(eventId);
        if (!fresh) {
            return { ok: true, handled: 'duplicate' };
        }
        if (type.startsWith('contact')) {
            await this.ghl.upsertContact({
                firstName: payload?.firstName ?? payload?.contact?.firstName,
                lastName: payload?.lastName ?? payload?.contact?.lastName,
                email: payload?.email ?? payload?.contact?.email,
                phone: payload?.phone ?? payload?.contact?.phone,
                tag: payload?.tag ?? payload?.source,
                ghlContactId: payload?.id ?? payload?.contactId ?? payload?.contact?.id,
                sourceTag: payload?.source,
            });
            return { ok: true, handled: 'contact' };
        }
        if (type.includes('opportunity')) {
            await this.ghl.upsertOpportunity({
                contactEmail: payload?.contactEmail ?? payload?.email ?? payload?.contact?.email,
                ghlContactId: payload?.contactId ?? payload?.ghlContactId ?? payload?.contact?.id,
                amount: payload?.amount ?? payload?.opportunityValue,
                stage: payload?.stage ??
                    payload?.pipelineStage ??
                    payload?.stage_name ??
                    payload?.opportunity?.stage_name,
                saleValue: payload?.saleValue ?? payload?.opportunity?.monetary_value,
                eventId,
            });
            return { ok: true, handled: 'opportunity' };
        }
        if (type.includes('appointment')) {
            await this.ghl.upsertAppointment({
                id: payload?.id ?? payload?.eventId ?? payload?.appointmentId,
                type: payload?.type ?? payload?.appointmentType,
                status: payload?.status,
                startTime: payload?.scheduledAt ?? payload?.startTime,
                contactEmail: payload?.leadEmail ?? payload?.contact?.email,
                ghlContactId: payload?.contactId ?? payload?.ghlContactId ?? payload?.contact?.id,
                ownerEmail: payload?.ownerEmail ?? payload?.user?.email,
                eventId,
            });
            return { ok: true, handled: 'appointment' };
        }
        if (payload?.contact || payload?.email) {
            await this.ghl.upsertContact({
                firstName: payload?.firstName ?? payload?.contact?.firstName,
                lastName: payload?.lastName ?? payload?.contact?.lastName,
                email: payload?.email ?? payload?.contact?.email,
                phone: payload?.phone ?? payload?.contact?.phone,
                tag: payload?.tag ?? payload?.source,
                ghlContactId: payload?.id ?? payload?.contactId ?? payload?.contact?.id,
                sourceTag: payload?.source,
            });
            return { ok: true, handled: 'contact-fallback' };
        }
        return { ok: true, handled: 'ignored' };
    }
};
exports.GhlController = GhlController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GhlController.prototype, "webhook", null);
exports.GhlController = GhlController = __decorate([
    (0, common_1.Controller)('integrations/ghl'),
    __metadata("design:paramtypes", [ghl_service_1.GhlService])
], GhlController);
//# sourceMappingURL=ghl.controller.js.map