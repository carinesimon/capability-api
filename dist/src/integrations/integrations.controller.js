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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
const client_1 = require("@prisma/client");
let IntegrationsController = class IntegrationsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async list() {
        return this.svc.listAutomationsWithAbsoluteUrl();
    }
    getLeadStages() {
        return { stages: Object.values(client_1.LeadStage) };
    }
    async create(body) {
        const a = await this.svc.createAutomation(body?.name || 'Sans titre');
        return this.svc.decorateAutomationAbsolute(a.id);
    }
    async get(id) {
        const a = await this.svc.getAutomationWithAbsoluteUrl(id);
        return { ...a, leadStages: Object.values(client_1.LeadStage) };
    }
    async update(id, body) {
        return this.svc.updateAutomation(id, body);
    }
    async remove(id) {
        await this.svc.deleteAutomation(id);
        return { ok: true };
    }
    async hardDeleteLead(id) {
        return this.svc.deleteLeadCompletely(id);
    }
    async duplicate(id) {
        return this.svc.duplicateAutomation(id);
    }
    async events(id, limit = '30') {
        const n = Math.max(1, Math.min(Number(limit) || 30, 1000));
        return this.svc.listEvents(id, n);
    }
    async replay(eventId) {
        return this.svc.replayEvent(eventId);
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Get)('automations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('lead-stages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "getLeadStages", null);
__decorate([
    (0, common_1.Post)('automations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('automations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('automations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('automations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('leads/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "hardDeleteLead", null);
__decorate([
    (0, common_1.Post)('automations/:id/duplicate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Get)('automations/:id/events'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "events", null);
__decorate([
    (0, common_1.Post)('events/:eventId/replay'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "replay", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, common_1.Controller)('integrations'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map