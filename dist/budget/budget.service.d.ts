import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
export declare class BudgetService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBudgetDto): import("@prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        period: import("@prisma/client").$Enums.BudgetPeriod;
        amount: number;
        weekStart: Date | null;
        monthStart: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(params?: {
        from?: Date;
        to?: Date;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        period: import("@prisma/client").$Enums.BudgetPeriod;
        amount: number;
        weekStart: Date | null;
        monthStart: Date | null;
    }[]>;
    sumSpend(from?: Date, to?: Date): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.GetBudgetAggregateType<{
        _sum: {
            amount: true;
        };
        where: {
            OR: ({
                period: "WEEKLY";
                weekStart: {
                    gte: Date | undefined;
                    lte: Date | undefined;
                };
            } | {
                period: "MONTHLY";
                monthStart: {
                    gte: Date | undefined;
                    lte: Date | undefined;
                };
            })[];
        } | undefined;
    }>>;
}
