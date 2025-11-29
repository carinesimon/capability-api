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
    async getSummary(from, to, _tz) {
        return this.reporting.summary(from, to);
    }
    async getBudgets() {
        return this.reporting.listWeeklyBudgets();
    }
    async upsertBudget(body) {
        const weekStartISO = body.weekStartISO;
        const parsedAmount = Number(body.amount) || 0;
        const budget = await this.reporting.upsertWeeklyBudget(weekStartISO, parsedAmount);
        return { ok: true, budget };
    }
    async getLeadsReceived(from, to, _tz) {
        return this.reporting.leadsReceived(from, to);
    }
    spotlightSetters(from, to, _tz) {
        return this.reporting.spotlightSetters(from, to);
    }
    spotlightClosers(from, to, _tz) {
        return this.reporting.spotlightClosers(from, to);
    }
    async exportSpotlightSettersCsv(from, to, _tz, res) {
        const buf = await this.reporting.exportSpotlightSettersCSV({ from, to });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="spotlight_setters_${from || 'from'}_${to || 'to'}.csv"`);
        return res.send(buf);
    }
    async exportSpotlightClosersCsv(from, to, _tz, res) {
        const buf = await this.reporting.exportSpotlightClosersCSV({ from, to });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="spotlight_closers_${from || 'from'}_${to || 'to'}.csv"`);
        return res.send(buf);
    }
    async exportSpotlightSettersPdf(from, to, _tz, res) {
        const buf = await this.reporting.exportSpotlightSettersPDF({ from, to });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="spotlight_setters_${from || 'from'}_${to || 'to'}.pdf"`);
        return res.send(buf);
    }
    async exportSpotlightClosersPdf(from, to, _tz, res) {
        const buf = await this.reporting.exportSpotlightClosersPDF({ from, to });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="spotlight_closers_${from || 'from'}_${to || 'to'}.pdf"`);
        return res.send(buf);
    }
    async getSalesWeekly(from, to, _tz) {
        return this.reporting.salesWeekly(from, to);
    }
    async getSetters(from, to, _tz) {
        return this.reporting.settersReport(from, to);
    }
    async getClosers(from, to, _tz) {
        return this.reporting.closersReport(from, to);
    }
    async getDuos(from, to, _tz) {
        return this.reporting.duosReport(from, to);
    }
    async getWeeklyOps(from, to, _tz) {
        const rows = await this.reporting.weeklySeries(from, to);
        return { ok: true, rows };
    }
    async getFunnel(from, to, _tz) {
        return this.reporting.funnel(from, to);
    }
    async getPipelineMetrics(keys, from, to, mode, _tz) {
        const list = (keys || '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
        return this.reporting.pipelineMetrics({ keys: list, from, to, mode });
    }
    async drillLeads(from, to, limitStr, _tz) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillLeadsReceived({ from, to, limit });
    }
    async drillWon(from, to, limitStr, _tz) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillWon({ from, to, limit });
    }
    async drillAppointments(from, to, type, status, userId, limitStr, _tz) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillAppointments({ from, to, type, status, userId, limit });
    }
    async drillCallRequests(from, to, limitStr, _tz) {
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillCallRequests({ from, to, limit });
    }
    async drillCalls(from, to, answeredStr, setterNoShowStr, limitStr, _tz) {
        const answered = answeredStr === '1' || answeredStr === 'true';
        const setterNoShow = setterNoShowStr === '1' || setterNoShowStr === 'true';
        const limit = Number(limitStr ?? 2000);
        return this.reporting.drillCalls({ from, to, answered, setterNoShow, limit });
    }
    async metricStageSeries(stage, from, to, _tz) {
        if (!stage)
            return { total: 0, byDay: [] };
        return this.reporting.stageSeries(stage, from, to);
    }
    async leadsByDay(from, to, _tz) {
        return this.reporting.leadsReceived(from, to);
    }
    async canceledDaily(from, to, _tz) {
        return this.reporting.canceledDaily(from, to);
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('reporting/summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('reporting/budget'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getBudgets", null);
__decorate([
    (0, common_1.Post)('reporting/budget'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "upsertBudget", null);
__decorate([
    (0, common_1.Get)('reporting/leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getLeadsReceived", null);
__decorate([
    (0, common_1.Get)('reporting/spotlight-setters'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "spotlightSetters", null);
__decorate([
    (0, common_1.Get)('reporting/spotlight-closers'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "spotlightClosers", null);
__decorate([
    (0, common_1.Get)('reporting/export/spotlight-setters.csv'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSpotlightSettersCsv", null);
__decorate([
    (0, common_1.Get)('reporting/export/spotlight-closers.csv'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSpotlightClosersCsv", null);
__decorate([
    (0, common_1.Get)('reporting/export/spotlight-setters.pdf'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSpotlightSettersPdf", null);
__decorate([
    (0, common_1.Get)('reporting/export/spotlight-closers.pdf'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "exportSpotlightClosersPdf", null);
__decorate([
    (0, common_1.Get)('reporting/sales-weekly'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSalesWeekly", null);
__decorate([
    (0, common_1.Get)('reporting/setters'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getSetters", null);
__decorate([
    (0, common_1.Get)('reporting/closers'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getClosers", null);
__decorate([
    (0, common_1.Get)('reporting/duos'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getDuos", null);
__decorate([
    (0, common_1.Get)('reporting/weekly-ops'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getWeeklyOps", null);
__decorate([
    (0, common_1.Get)('reporting/funnel'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('reporting/pipeline-metrics'),
    __param(0, (0, common_1.Query)('keys')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('mode')),
    __param(4, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getPipelineMetrics", null);
__decorate([
    (0, common_1.Get)('reporting/drill/leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillLeads", null);
__decorate([
    (0, common_1.Get)('reporting/drill/won'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillWon", null);
__decorate([
    (0, common_1.Get)('reporting/drill/appointments'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('userId')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillAppointments", null);
__decorate([
    (0, common_1.Get)('reporting/drill/call-requests'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillCallRequests", null);
__decorate([
    (0, common_1.Get)('reporting/drill/calls'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('answered')),
    __param(3, (0, common_1.Query)('setterNoShow')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "drillCalls", null);
__decorate([
    (0, common_1.Get)('metrics/stage-series'),
    __param(0, (0, common_1.Query)('stage')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "metricStageSeries", null);
__decorate([
    (0, common_1.Get)('metrics/leads-by-day'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "leadsByDay", null);
__decorate([
    (0, common_1.Get)('reporting/metrics/canceled-daily'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('tz')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "canceledDaily", null);
exports.ReportingController = ReportingController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map