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
exports.HookController = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
let HookController = class HookController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async receiveHook(routeKey, req, headers) {
        const contentType = (headers['content-type'] || headers['Content-Type'] || 'application/json');
        const payload = req.body ?? {};
        const ev = await this.svc.receiveWebhook(routeKey, contentType, payload);
        return { ok: true, eventId: ev.id };
    }
};
exports.HookController = HookController;
__decorate([
    (0, common_1.Post)('hook/:routeKey'),
    __param(0, (0, common_1.Param)('routeKey')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], HookController.prototype, "receiveHook", null);
exports.HookController = HookController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], HookController);
//# sourceMappingURL=hook.controller.js.map