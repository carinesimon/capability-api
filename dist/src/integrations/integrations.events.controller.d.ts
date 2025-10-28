import { IntegrationsService } from './integrations.service';
export declare class IntegrationsEventsController {
    private readonly svc;
    constructor(svc: IntegrationsService);
    replay(id: string, modeParam?: string): Promise<{
        ok: boolean;
        ignored: boolean;
        reason: string;
        leadId?: undefined;
        dryRun?: undefined;
        mode?: undefined;
    } | {
        ok: boolean;
        leadId: null;
        dryRun: boolean;
        mode: "upsert" | "createNew";
        ignored?: undefined;
        reason?: undefined;
    } | {
        ok: boolean;
        leadId: string;
        mode: "upsert" | "createNew";
        ignored?: undefined;
        reason?: undefined;
        dryRun?: undefined;
    }>;
}
