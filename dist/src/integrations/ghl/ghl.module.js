"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlModule = void 0;
const common_1 = require("@nestjs/common");
const ghl_controller_1 = require("./ghl.controller");
const ghl_service_1 = require("./ghl.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const leads_module_1 = require("../../modules/leads/leads.module");
let GhlModule = class GhlModule {
};
exports.GhlModule = GhlModule;
exports.GhlModule = GhlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            leads_module_1.LeadsModule,
        ],
        controllers: [ghl_controller_1.GhlController],
        providers: [ghl_service_1.GhlService, prisma_service_1.PrismaService],
    })
], GhlModule);
//# sourceMappingURL=ghl.module.js.map
