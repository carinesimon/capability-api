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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const metrics_service_1 = require("./metrics.service");
function parseDateOrThrow(label, value) {
    if (!value) {
        throw new common_1.BadRequestException(`Query param "${label}" est requis (YYYY-MM-DD)`);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        throw new common_1.BadRequestException(`Query param "${label}" invalide : "${value}"`);
    }
    return d;
}
let MetricsController = class MetricsController {
    metrics;
    constructor(metrics) {
        this.metrics = metrics;
    }
    async getFunnel(from, to) {
        const start = parseDateOrThrow('from', from);
        const endDate = parseDateOrThrow('to', to);
        const endExclusive = new Date(endDate);
        endExclusive.setDate(endExclusive.getDate() + 1);
        return this.metrics.funnelTotals({ start, end: endExclusive });
    }
    async getLeadsByDay(from, to) {
        const start = parseDateOrThrow('from', from);
        const endDate = parseDateOrThrow('to', to);
        const endExclusive = new Date(endDate);
        endExclusive.setDate(endExclusive.getDate() + 1);
        return this.metrics.leadsByDay({ start, end: endExclusive });
    }
    async getStageSeries(stageStr, from, to) {
        if (!stageStr) {
            throw new common_1.BadRequestException('Query param "stage" est requis');
        }
        const start = parseDateOrThrow('from', from);
        const endDate = parseDateOrThrow('to', to);
        const endExclusive = new Date(endDate);
        endExclusive.setDate(endExclusive.getDate() + 1);
        const stage = stageStr;
        return this.metrics.stageSeriesByDay({ start, end: endExclusive, stage });
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Get)('funnel'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('leads-by-day'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getLeadsByDay", null);
__decorate([
    (0, common_1.Get)('stage-series'),
    __param(0, (0, common_1.Query)('stage')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getStageSeries", null);
exports.MetricsController = MetricsController = __decorate([
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map