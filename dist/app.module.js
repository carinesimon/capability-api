"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const leads_module_1 = require("../src/modules/leads/leads.module");
const admin_module_1 = require("./admin/admin.module");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const appointments_module_1 = require("./appointments/appointments.module");
const attribution_module_1 = require("./attribution/attribution.module");
const reporting_module_1 = require("./reporting/reporting.module");
const pdf_export_module_1 = require("./pdf-export/pdf-export.module");
const contracts_module_1 = require("./contracts/contracts.module");
const budget_module_1 = require("./budget/budget.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const prospects_module_1 = require("./prospects/prospects.module");
const ghl_module_1 = require("./integrations/ghl/ghl.module");
const integrations_module_1 = require("./integrations/integrations.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
const leads_alias_controller_1 = require("./leads/leads-alias.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            leads_module_1.LeadsModule,
            metrics_module_1.MetricsModule,
            admin_module_1.AdminModule,
            appointments_module_1.AppointmentsModule,
            attribution_module_1.AttributionModule,
            reporting_module_1.ReportingModule,
            pdf_export_module_1.PdfExportModule,
            contracts_module_1.ContractsModule,
            budget_module_1.BudgetModule,
            webhooks_module_1.WebhooksModule,
            prospects_module_1.ProspectsModule,
            ghl_module_1.GhlModule,
            integrations_module_1.IntegrationsModule,
        ],
        controllers: [app_controller_1.AppController, leads_alias_controller_1.LeadsAliasController,],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map