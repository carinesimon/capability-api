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
    summary(from, to) {
        return this.reporting.summary(from, to);
    }
    leadsReceived(from, to) {
        return this.reporting.leadsReceived(from, to);
    }
    salesWeekly(from, to) {
        return this.reporting.salesWeekly(from, to);
    }
    setters(from, to) {
        return this.reporting.settersReport(from, to);
    }
    closers(from, to) {
        return this.reporting.closersReport(from, to);
    }
    async duos(from, to, top) {
        const n = Math.max(1, Math.min(50, Number(top) || 10));
        return this.reporting.duosReport(from, to, n);
    }
    pipelineMetrics(keysCsv, from, to, mode = 'entered') {
        const keys = (keysCsv || '').split(',').map(s => s.trim()).filter(Boolean);
        return this.reporting.pipelineMetrics({ keys, from, to, mode });
    }
    weeklyOps(from, to) {
        return this.reporting.weeklySeries(from, to).then(rows => ({ ok: true, rows }));
    }
    metricCallRequests(from, to) {
        return this.reporting.metricCallRequests(from, to);
    }
    metricCalls(from, to) {
        return this.reporting.metricCalls(from, to);
    }
    metricCallsAnswered(from, to) {
        return this.reporting.metricCallsAnswered(from, to);
    }
    funnel(from, to) {
        return this.reporting.funnel(from, to);
    }
    drillAppointments(from, to, type, status, userId, limit = '2000') {
        return this.reporting.drillAppointments({ from, to, type, status, userId, limit: Number(limit) });
    }
    drillWon(from, to, limit = '2000') {
        return this.reporting.drillWon({ from, to, limit: Number(limit) });
    }
    drillLeadsReceived(from, to, limit = '2000') {
        return this.reporting.drillLeadsReceived({ from, to, limit: Number(limit) });
    }
    drillCallRequests(from, to, limit = '2000') {
        return this.reporting.drillCallRequests({ from, to, limit: Number(limit) });
    }
    drillCalls(from, to, answered, setterNoShow, limit = '2000') {
        return this.reporting.drillCalls({
            from, to,
            answered: answered ? Boolean(Number(answered)) : false,
            setterNoShow: setterNoShow ? Boolean(Number(setterNoShow)) : false,
            limit: Number(limit),
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
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "leadsReceived", null);
__decorate([
    (0, common_1.Get)('sales-weekly'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "salesWeekly", null);
__decorate([
    (0, common_1.Get)('setters'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "setters", null);
__decorate([
    (0, common_1.Get)('closers'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "closers", null);
__decorate([
    (0, common_1.Get)('duos'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('top')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "duos", null);
__decorate([
    (0, common_1.Get)('pipeline-metrics'),
    __param(0, (0, common_1.Query)('keys')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "pipelineMetrics", null);
__decorate([
    (0, common_1.Get)('weekly-ops'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "weeklyOps", null);
__decorate([
    (0, common_1.Get)('metric/call-requests'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "metricCallRequests", null);
__decorate([
    (0, common_1.Get)('metric/calls'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "metricCalls", null);
__decorate([
    (0, common_1.Get)('metric/calls-answered'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "metricCallsAnswered", null);
__decorate([
    (0, common_1.Get)('funnel'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "funnel", null);
__decorate([
    (0, common_1.Get)('drill/appointments'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('userId')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "drillAppointments", null);
__decorate([
    (0, common_1.Get)('drill/won'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "drillWon", null);
__decorate([
    (0, common_1.Get)('drill/leads-received'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "drillLeadsReceived", null);
__decorate([
    (0, common_1.Get)('drill/call-requests'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "drillCallRequests", null);
__decorate([
    (0, common_1.Get)('drill/calls'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('answered')),
    __param(3, (0, common_1.Query)('setterNoShow')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "drillCalls", null);
exports.ReportingController = ReportingController = __decorate([
    (0, common_1.Controller)('reporting'),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map