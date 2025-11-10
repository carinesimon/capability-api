import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
import { StageEventsService } from './stage-events.service';
export declare class LeadsService {
    private prisma;
    private stageEvents;
    constructor(prisma: PrismaService, stageEvents: StageEventsService);
    updateLeadStage(leadId: string, toStage: LeadStage, source?: string, externalId?: string): Promise<{
        ok: boolean;
    }>;
    moveToBoardColumn(leadId: string, columnKey: string): Promise<{
        ok: boolean;
    }>;
    deleteLead(leadId: string): Promise<{
        ok: boolean;
    }>;
}
