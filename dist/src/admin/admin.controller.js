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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    async seedDemo(days = '60', setters = '3', closers = '3', leads = '180') {
        const d = parseInt(days, 10) || 60;
        const s = parseInt(setters, 10) || 3;
        const c = parseInt(closers, 10) || 3;
        const l = parseInt(leads, 10) || 180;
        return this.admin.seedDemo({ days: d, setters: s, closers: c, leads: l });
    }
    async seedDemoOpen(days = '60', setters = '3', closers = '3', leads = '180') {
        if (process.env.NODE_ENV === 'production' || process.env.ALLOW_OPEN_SEED !== '1') {
            throw new common_1.UnauthorizedException('Open seed is disabled. Set ALLOW_OPEN_SEED=1 (dev only).');
        }
        const d = parseInt(days, 10) || 60;
        const s = parseInt(setters, 10) || 3;
        const c = parseInt(closers, 10) || 3;
        const l = parseInt(leads, 10) || 180;
        return this.admin.seedDemo({ days: d, setters: s, closers: c, leads: l });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('seed-demo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('setters')),
    __param(2, (0, common_1.Query)('closers')),
    __param(3, (0, common_1.Query)('leads')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "seedDemo", null);
__decorate([
    (0, common_1.Post)('seed-demo-open'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('setters')),
    __param(2, (0, common_1.Query)('closers')),
    __param(3, (0, common_1.Query)('leads')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "seedDemoOpen", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map