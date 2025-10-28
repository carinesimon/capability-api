import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
export declare class StageEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    recordStageEntry(opts: {
        leadId: string;
        fromStage?: LeadStage | null;
        toStage: LeadStage;
        source?: string;
        externalId?: string | null;
        occurredAt?: Date;
    }): Promise<{
        id: string;
        type: string;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        occurredAt: Date;
        createdAt: Date;
        leadId: string;
    } | null>;
}
