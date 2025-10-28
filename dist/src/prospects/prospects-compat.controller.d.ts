import { LeadStage } from '@prisma/client';
import { LeadsService } from '../modules/leads/leads.service';
export declare class ProspectsCompatController {
    private readonly leads;
    constructor(leads: LeadsService);
    postEvent(id: string, body: {
        toStage?: LeadStage;
        columnKey?: string;
        source?: string;
        externalId?: string;
    }): Promise<{
        ok: boolean;
        via: string;
        message?: undefined;
    } | {
        ok: boolean;
        message: string;
        via?: undefined;
    }>;
    deleteProspect(id: string): Promise<{
        ok: boolean;
    }>;
}
