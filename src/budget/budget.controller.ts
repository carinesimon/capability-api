import { Body, Controller, Get, Post, Patch, Query } from '@nestjs/common';
import { BudgetService } from './budget.service';

@Controller('budget')
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  /**
   * Création / mise à jour de budget.
   *
   * 🔹 Nouveau format utilisé par le frontend Budget :
   *    POST /reporting/budget
   *    { "weekStartISO": "2025-09-22T00:00:00.000Z", "amount": 500, "cashIn": 3000 }
   *
   * 🔹 Ancien format (period + weekStart / monthStart) toujours supporté.
   */
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  /**
   * Liste des budgets sur une fenêtre.
   *
   * GET /reporting/budget?from=2025-09-01&to=2025-09-30
   */
  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  /**
   * 🔹 Endpoint pour la comptable :
   * PATCH /reporting/budget/cash-in
   * { "weekStartISO": "2025-09-22T00:00:00.000Z", "cashIn": 3500 }
   */
  @Patch('cash-in')
  async updateCashIn(
    @Body('weekStartISO') weekStartISO: string,
    @Body('cashIn') cashIn: number,
  ) {
    return this.service.updateCashIn(weekStartISO, Number(cashIn));
  }
}
