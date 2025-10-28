"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProspectsModule = void 0;
const common_1 = require("@nestjs/common");
const prospects_controller_1 = require("./prospects.controller");
const prospects_service_1 = require("./prospects.service");
const prisma_service_1 = require("../prisma/prisma.service");
const reporting_service_1 = require("../reporting/reporting.service");
const leads_module_1 = require("../modules/leads/leads.module");
const prisma_module_1 = require("../prisma/prisma.module");
const prospects_compat_controller_1 = require("./prospects-compat.controller");
let ProspectsModule = class ProspectsModule {
};
exports.ProspectsModule = ProspectsModule;
exports.ProspectsModule = ProspectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            leads_module_1.LeadsModule,
        ],
        controllers: [prospects_controller_1.ProspectsController, prospects_compat_controller_1.ProspectsCompatController],
        providers: [
            prospects_service_1.ProspectsService,
            prisma_service_1.PrismaService,
            reporting_service_1.ReportingService,
            leads_module_1.LeadsModule,
        ],
        exports: [prospects_service_1.ProspectsService],
    })
], ProspectsModule);
//# sourceMappingURL=prospects.module.js.map