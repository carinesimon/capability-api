export declare class GhlWebhookService {
    verifySignature(_raw: Buffer | string, _signature?: string): Promise<boolean>;
    handleContact(payload: any): Promise<{
        ok: boolean;
        leadId: string;
    }>;
    handleOpportunity(payload: any): Promise<{
        ok: boolean;
        leadId: string;
    }>;
    handleAppointment(payload: any): Promise<{
        ok: boolean;
    }>;
    handleCall(payload: any): Promise<{
        ok: boolean;
    }>;
}
