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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MetricsService = class MetricsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async funnelTotals(params) {
        const { start, end } = params;
        const leadsReceived = await this.prisma.lead.count({
            where: {
                createdAt: {
                    gte: start,
                    lt: end,
                },
            },
        });
        const rows = await this.prisma.stageEvent.groupBy({
            by: ['toStage'],
            where: {
                occurredAt: {
                    gte: start,
                    lt: end,
                },
            },
            _count: {
                _all: true,
            },
        });
        const out = {};
        for (const s of Object.values(client_1.LeadStage)) {
            out[s] = 0;
        }
        for (const row of rows) {
            out[row.toStage] = row._count._all;
        }
        out.LEADS_RECEIVED = leadsReceived;
        return out;
    }
    async leadsByDay(params) {
        const { start, end } = params;
        const rows = await this.prisma.lead.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lt: end,
                },
            },
            select: { createdAt: true },
        });
        const buckets = new Map();
        for (const r of rows) {
            const d = r.createdAt;
            const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            buckets.set(day, (buckets.get(day) ?? 0) + 1);
        }
        const byDay = Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, count]) => ({ day, count }));
        return {
            total: rows.length,
            byDay,
        };
    }
    async stageSeriesByDay(params) {
        const { start, end, stage } = params;
        const events = await this.prisma.stageEvent.findMany({
            where: {
                toStage: stage,
                occurredAt: {
                    gte: start,
                    lt: end,
                },
            },
            select: { occurredAt: true },
        });
        const buckets = new Map();
        for (const ev of events) {
            const d = ev.occurredAt;
            const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            buckets.set(day, (buckets.get(day) ?? 0) + 1);
        }
        const byDay = Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, count]) => ({ day, count }));
        return {
            total: events.length,
            byDay,
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map