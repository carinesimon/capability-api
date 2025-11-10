import { GhlWebhookService } from './ghl.webhook.service';
export declare class GhlWebhookController {
    private readonly svc;
    constructor(svc: GhlWebhookService);
    handle(req: any, signature?: string): Promise<{
        ok: boolean;
    }>;
}
