import { LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
type StageMoveInput = {
    leadId: string;
    toStage: LeadStage;
    occurredAt?: Date;
    source?: string;
    actorId?: string | null;
    externalId?: string | null;
};
type FunnelParams = {
    start: Date;
    end: Date;
    stages?: LeadStage[];
    distinctLeads?: boolean;
};
export declare class LeadStageService {
    private prisma;
    constructor(prisma: PrismaService);
    moveLeadToStage(input: StageMoveInput): Promise<{
        id: string;
        createdAt: Date;
        leadId: string;
        occurredAt: Date;
        type: string;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    recordStageEntry(input: StageMoveInput): Promise<{
        id: string;
        createdAt: Date;
        leadId: string;
        occurredAt: Date;
        type: string;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getFunnelStats(params: FunnelParams): Promise<Record<LeadStage, number>>;
}
export {};
