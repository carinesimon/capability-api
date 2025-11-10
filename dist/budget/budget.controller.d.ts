import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
export declare class BudgetController {
    private readonly service;
    constructor(service: BudgetService);
    create(body: CreateBudgetDto): import("@prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        period: import("@prisma/client").$Enums.BudgetPeriod;
        amount: number;
        weekStart: Date | null;
        monthStart: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(from?: string, to?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        period: import("@prisma/client").$Enums.BudgetPeriod;
        amount: number;
        weekStart: Date | null;
        monthStart: Date | null;
    }[]>;
}
