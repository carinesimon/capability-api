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
exports.ProspectsController = void 0;
const common_1 = require("@nestjs/common");
const prospects_service_1 = require("./prospects.service");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const create_prospect_event_dto_1 = require("./dto/create-prospect-event.dto");
let ProspectsController = class ProspectsController {
    svc;
    prisma;
    constructor(svc, prisma) {
        this.svc = svc;
        this.prisma = prisma;
    }
    async stageOptions() {
        const rows = await this.prisma.prospectsColumnConfig.findMany({
            where: { enabled: true, NOT: { stage: null } },
            select: { label: true, stage: true, order: true },
            orderBy: { order: 'asc' },
        });
        return rows.map((r) => ({ value: r.stage, label: r.label }));
    }
    getBoard(from, to, limit) {
        return this.svc.getBoard({ from, to, limit: Number(limit ?? 200) });
    }
    getColumnsConfig() {
        return this.svc.getColumnsConfig();
    }
    putColumnsConfig(payload) {
        return this.svc.putColumnsConfig(payload);
    }
    async actors() {
        const rows = await this.prisma.user.findMany({
            where: { role: { in: [client_1.Role.SETTER, client_1.Role.CLOSER] }, isActive: true },
            select: { id: true, firstName: true, email: true, role: true },
            orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
        });
        const setters = rows
            .filter((r) => r.role === client_1.Role.SETTER)
            .map((r) => ({ id: r.id, firstName: r.firstName, email: r.email }));
        const closers = rows
            .filter((r) => r.role === client_1.Role.CLOSER)
            .map((r) => ({ id: r.id, firstName: r.firstName, email: r.email }));
        return { setters, closers };
    }
    async addEvent(id, dto) {
        return this.svc.addEvent(id, dto);
    }
    createLead(body) {
        return this.svc.createLead(body);
    }
    moveStage(id, body) {
        return this.svc.moveStage(id, body);
    }
    updateOne(id, body) {
        return this.svc.updateOne(id, body);
    }
    getOne(id) {
        return this.svc.getOne(id);
    }
};
exports.ProspectsController = ProspectsController;
__decorate([
    (0, common_1.Get)('stage-options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProspectsController.prototype, "stageOptions", null);
__decorate([
    (0, common_1.Get)('board'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "getBoard", null);
__decorate([
    (0, common_1.Get)('columns-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "getColumnsConfig", null);
__decorate([
    (0, common_1.Put)('columns-config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "putColumnsConfig", null);
__decorate([
    (0, common_1.Get)('actors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProspectsController.prototype, "actors", null);
__decorate([
    (0, common_1.Post)(':id/events'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_prospect_event_dto_1.CreateProspectEventDto]),
    __metadata("design:returntype", Promise)
], ProspectsController.prototype, "addEvent", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "createLead", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "moveStage", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "updateOne", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProspectsController.prototype, "getOne", null);
exports.ProspectsController = ProspectsController = __decorate([
    (0, common_1.Controller)('prospects'),
    __metadata("design:paramtypes", [prospects_service_1.ProspectsService,
        prisma_service_1.PrismaService])
], ProspectsController);
//# sourceMappingURL=prospects.controller.js.map