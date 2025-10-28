import { GhlService } from './ghl.service';
type GhlWebhookBody = {
    eventId?: string;
    type?: string;
    payload?: any;
};
export declare class GhlController {
    private readonly ghl;
    constructor(ghl: GhlService);
    webhook(body: GhlWebhookBody): Promise<{
        ok: boolean;
        handled: string;
    }>;
}
export {};
