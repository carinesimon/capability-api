import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
export declare class MetricsService {
    private prisma;
    constructor(prisma: PrismaService);
    funnelTotals(params: {
        start: Date;
        end: Date;
        stages?: LeadStage[];
    }): Promise<{
        [k: string]: number;
    }>;
}
