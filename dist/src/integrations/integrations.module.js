"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const integrations_service_1 = require("./integrations.service");
const integrations_controller_1 = require("./integrations.controller");
const hook_controller_1 = require("./hook.controller");
const auto_assign_service_1 = require("./auto-assign.service");
const leads_module_1 = require("../modules/leads/leads.module");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, leads_module_1.LeadsModule,],
        providers: [integrations_service_1.IntegrationsService, auto_assign_service_1.AutoAssignService],
        controllers: [integrations_controller_1.IntegrationsController, hook_controller_1.HookController],
        exports: [integrations_service_1.IntegrationsService, auto_assign_service_1.AutoAssignService],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map
