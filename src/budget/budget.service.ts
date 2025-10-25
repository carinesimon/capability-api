import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetPeriod } from '@prisma/client';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateBudgetDto) {
    if (dto.period === BudgetPeriod.WEEKLY && !dto.weekStart) {
      throw new Error('weekStart is required for WEEKLY budgets');
    }
    if (dto.period === BudgetPeriod.MONTHLY && !dto.monthStart) {
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

  findAll(params?: { from?: Date; to?: Date }) {
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

  sumSpend(from?: Date, to?: Date) {
    // Agrégation naïve : somme des budgets qui tombent dans la fenêtre
    // (suffisant pour démarrer; on pourra pondérer si fenêtre partielle)
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
}
