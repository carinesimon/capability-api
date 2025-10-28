import { IntegrationsService } from './integrations.service';
export declare class HookController {
    private readonly svc;
    constructor(svc: IntegrationsService);
    receiveHook(routeKey: string, req: any, headers: Record<string, any>): Promise<{
        ok: boolean;
        eventId: any;
    }>;
}
