import { WebhooksService } from './webhooks.service';
export declare class GhlController {
    private readonly service;
    constructor(service: WebhooksService);
    handle(req: any, headers: Record<string, any>): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
}
