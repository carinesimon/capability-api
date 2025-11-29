import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetPeriod } from '@prisma/client';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  /**
   * Création / mise à jour de budgets.
   *
   * 🔹 Si body contient { weekStartISO, amount, cashIn? } → upsert hebdo (utilisé par le frontend Budget).
   * 🔹 Sinon, on utilise l'ancien format DTO (period + weekStart / monthStart).
   */
  async create(body: any) {
    // === Nouveau format : { weekStartISO, amount, cashIn? } ===
    if (body?.weekStartISO) {
      const weekStart = new Date(body.weekStartISO);
      if (Number.isNaN(weekStart.getTime())) {
        throw new Error('weekStartISO invalide');
      }

      const amountRaw = body.amount;
      const cashInRaw = body.cashIn;

      const amount =
        amountRaw !== undefined && amountRaw !== null
          ? Number(amountRaw)
          : null;
      const caEncaisse =
        cashInRaw !== undefined && cashInRaw !== null
          ? Number(cashInRaw)
          : null;

      if (amount !== null && !Number.isFinite(amount)) {
        throw new Error('amount doit être un nombre');
      }
      if (caEncaisse !== null && !Number.isFinite(caEncaisse)) {
        throw new Error('cashIn doit être un nombre');
      }

      return this.prisma.budget.upsert({
        where: {
          // nécessite @@unique([period, weekStart]) dans Prisma
          period_weekStart: {
            period: BudgetPeriod.WEEKLY,
            weekStart,
          },
        },
        create: {
          period: BudgetPeriod.WEEKLY,
          amount: amount ?? 0,
          weekStart,
          caEncaisse: caEncaisse ?? 0,
        },
        update: {
          ...(amount !== null ? { amount } : {}),
          ...(caEncaisse !== null ? { caEncaisse } : {}),
        },
      });
    }

    // === Ancien format DTO (period + weekStart / monthStart) ===
    const dto = body as CreateBudgetDto;

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
        // caEncaisse reste à 0 par défaut
      },
    });
  }

  /**
   * Liste des budgets (hebdo / mensuels), filtrés par intervalle.
   * Utilisé par le dashboard pour reconstruire les vues par semaine.
   */
  findAll(params?: { from?: Date; to?: Date }) {
    const { from, to } = params ?? {};
    return this.prisma.budget.findMany({
      where:
        from || to
          ? {
              OR: [
                {
                  period: 'WEEKLY',
                  weekStart: {
                    gte: from ?? undefined,
                    lte: to ?? undefined,
                  },
                },
                {
                  period: 'MONTHLY',
                  monthStart: {
                    gte: from ?? undefined,
                    lte: to ?? undefined,
                  },
                },
              ],
            }
          : undefined,
      orderBy: [{ period: 'asc' }, { weekStart: 'desc' }, { monthStart: 'desc' }],
    });
  }

  /**
   * Somme simple des budgets sur la fenêtre (utilisable pour “budget total dépensé / prévu”).
   */
  sumSpend(from?: Date, to?: Date) {
    return this.prisma.budget.aggregate({
      _sum: { amount: true },
      where:
        from || to
          ? {
              OR: [
                {
                  period: 'WEEKLY',
                  weekStart: {
                    gte: from ?? undefined,
                    lte: to ?? undefined,
                  },
                },
                {
                  period: 'MONTHLY',
                  monthStart: {
                    gte: from ?? undefined,
                    lte: to ?? undefined,
                  },
                },
              ],
            }
          : undefined,
    });
  }

  /**
   * 🔹 Endpoint dédié comptable : mise à jour du CA encaissé (caEncaisse) sur une semaine.
   */
  async updateCashIn(weekStartISO: string, cashIn: number) {
    const weekStart = new Date(weekStartISO);
    if (Number.isNaN(weekStart.getTime())) {
      throw new Error('weekStartISO invalide');
    }
    if (!Number.isFinite(cashIn) || cashIn < 0) {
      throw new Error('cashIn doit être un nombre positif');
    }

    return this.prisma.budget.upsert({
      where: {
        period_weekStart: {
          period: BudgetPeriod.WEEKLY,
          weekStart,
        },
      },
      create: {
        period: BudgetPeriod.WEEKLY,
        amount: 0,
        weekStart,
        caEncaisse: cashIn,
      },
      update: {
        caEncaisse: cashIn,
      },
    });
  }
}
