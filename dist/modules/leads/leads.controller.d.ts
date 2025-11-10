import { LeadsService } from './leads.service';
import { LeadStage } from '@prisma/client';
export declare class LeadsController {
    private leads;
    constructor(leads: LeadsService);
    moveStage(id: string, body: {
        toStage: LeadStage;
        source?: string;
        externalId?: string;
    }): Promise<{
        ok: boolean;
    }>;
    moveBoard(id: string, body: {
        columnKey: string;
    }): Promise<{
        ok: boolean;
    }>;
}
