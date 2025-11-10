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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const reporting_service_1 = require("./reporting.service");
let ReportingController = class ReportingController {
    reporting;
    constructor(reporting) {
        this.reporting = reporting;
    }
    async getSummary(from, to) {
        return this.reporting.summary(from, to);
    }
    async getLeadsReceived(from, to) {
        return this.reporting.leadsReceived(from, to);
    }
    async getSalesWeekly(from, to) {
        return this.reporting.salesWeekly(from, to);
    }
    async getSetters(from, to) {
        return this.reporting.settersReport(from, to);
    }
    async getClosers(from, to) {
        return this.reporting.closersReport(from, to);
    }
    async getDuos(from, to) {
        return this.reporting.duosReport(from, to);
    }
    async getWeeklyOps(from, to) {
        const rows = await this.reporting.weeklySeries(from, to);
        return { ok: true, rows };
    }
    async drillLeads(from, to, limitStr) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillLeadsReceived({ from, to, limit });
    }
    async drillWon(from, to, limitStr) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillWon({ from, to, limit });
    }
    async drillAppointments(from, to, type, status, userId, limitStr) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillAppointments({ from, to, type, status, userId, limit });
    }
    async drillCallRequests(from, to, limitStr) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillCallRequests({ from, to, limit });
    }
    async drillCalls(from, to, answeredStr, setterNoShowStr, limitStr) {
        const answered = answeredStr === '1' || answeredStr === 'true';
        const setterNoShow = setterNoShowStr === '1' || setterNoShowStr === 'true';
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillCalls({
            from,
            to,
            answered,
            setterNoShow,
            limit,
        });
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getLeadsReceived", null);
__decorate([
    (0, common_1.Get)('sales-weekly'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSalesWeekly", null);
__decorate([
    (0, common_1.Get)('setters'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSetters", null);
__decorate([
    (0, common_1.Get)('closers'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getClosers", null);
__decorate([
    (0, common_1.Get)('duos'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getDuos", null);
__decorate([
    (0, common_1.Get)('weekly-ops'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getWeeklyOps", null);
__decorate([
    (0, common_1.Get)('drill/leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillLeads", null);
__decorate([
    (0, common_1.Get)('drill/won'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillWon", null);
__decorate([
    (0, common_1.Get)('drill/appointments'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('userId')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillAppointments", null);
__decorate([
    (0, common_1.Get)('drill/call-requests'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillCallRequests", null);
__decorate([
    (0, common_1.Get)('drill/calls'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('answered')),
    __param(3, (0, common_1.Query)('setterNoShow')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillCalls", null);
exports.ReportingController = ReportingController = __decorate([
    (0, common_1.Controller)('reporting'),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map