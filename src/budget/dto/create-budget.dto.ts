import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BudgetPeriod } from '@prisma/client';

export class CreateBudgetDto {
  @IsEnum(BudgetPeriod) period: BudgetPeriod; // 'WEEKLY' | 'MONTHLY'
  @IsNumber() amount: number;

  // ISO date (ex: "2025-09-22T00:00:00.000Z")
  @IsOptional() @IsString() weekStart?: string;
  @IsOptional() @IsString() monthStart?: string;
}
