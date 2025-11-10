import { BudgetPeriod } from '@prisma/client';
export declare class CreateBudgetDto {
    period: BudgetPeriod;
    amount: number;
    weekStart?: string;
    monthStart?: string;
}
