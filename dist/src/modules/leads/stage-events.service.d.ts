import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
export declare class StageEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    recordStageEntry(opts: {
        leadId: string;
        fromStage?: LeadStage | null;
        toStage: LeadStage;
        source?: string | null;
        externalId?: string | null;
        occurredAt?: Date;
    }): Promise<{
        id: string;
        source: string | null;
        leadId: string;
        externalId: string | null;
        occurredAt: Date;
        fromStage: import("@prisma/client").$Enums.LeadStage | null;
        toStage: import("@prisma/client").$Enums.LeadStage;
        dedupHash: string | null;
    }>;
}
