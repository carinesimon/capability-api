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
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BudgetService = class BudgetService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        if (dto.period === client_1.BudgetPeriod.WEEKLY && !dto.weekStart) {
            throw new Error('weekStart is required for WEEKLY budgets');
        }
        if (dto.period === client_1.BudgetPeriod.MONTHLY && !dto.monthStart) {
            throw new Error('monthStart is required for MONTHLY budgets');
        }
        return this.prisma.budget.create({
            data: {
                period: dto.period,
                amount: dto.amount,
                weekStart: dto.weekStart ? new Date(dto.weekStart) : null,
                monthStart: dto.monthStart ? new Date(dto.monthStart) : null,
            },
        });
    }
    findAll(params) {
        const { from, to } = params ?? {};
        return this.prisma.budget.findMany({
            where: (from || to)
                ? {
                    OR: [
                        { period: 'WEEKLY', weekStart: { gte: from ?? undefined, lte: to ?? undefined } },
                        { period: 'MONTHLY', monthStart: { gte: from ?? undefined, lte: to ?? undefined } },
                    ],
                }
                : undefined,
            orderBy: [{ period: 'asc' }, { weekStart: 'desc' }, { monthStart: 'desc' }],
        });
    }
    sumSpend(from, to) {
        return this.prisma.budget.aggregate({
            _sum: { amount: true },
            where: (from || to)
                ? {
                    OR: [
                        { period: 'WEEKLY', weekStart: { gte: from ?? undefined, lte: to ?? undefined } },
                        { period: 'MONTHLY', monthStart: { gte: from ?? undefined, lte: to ?? undefined } },
                    ],
                }
                : undefined,
        });
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map