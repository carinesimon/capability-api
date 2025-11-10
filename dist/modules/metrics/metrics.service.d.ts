import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
export type FunnelTotals = Record<string, number>;
export declare class MetricsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    funnelTotals(params: {
        start: Date;
        end: Date;
    }): Promise<FunnelTotals>;
    leadsByDay(params: {
        start: Date;
        end: Date;
    }): Promise<{
        total: number;
        byDay: {
            day: string;
            count: number;
        }[];
    }>;
    stageSeriesByDay(params: {
        start: Date;
        end: Date;
        stage: LeadStage;
    }): Promise<{
        total: number;
        byDay: {
            day: string;
            count: number;
        }[];
    }>;
}
