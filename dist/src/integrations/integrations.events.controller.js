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
exports.IntegrationsEventsController = void 0;
const common_1 = require("@nestjs/common");
const integrations_service_1 = require("./integrations.service");
let IntegrationsEventsController = class IntegrationsEventsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async replay(id, modeParam) {
        const mode = modeParam === 'createNew' ? 'createNew' : 'upsert';
        const result = await this.svc.replayEvent(id, { mode });
        return result;
    }
};
exports.IntegrationsEventsController = IntegrationsEventsController;
__decorate([
    (0, common_1.Post)(':id/replay'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IntegrationsEventsController.prototype, "replay", null);
exports.IntegrationsEventsController = IntegrationsEventsController = __decorate([
    (0, common_1.Controller)('integrations/events'),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsEventsController);
//# sourceMappingURL=integrations.events.controller.js.map