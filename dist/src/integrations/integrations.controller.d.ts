import { IntegrationsService } from './integrations.service';
export declare class IntegrationsController {
    private readonly svc;
    constructor(svc: IntegrationsService);
    list(): Promise<{
        webhookUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        routeKey: string;
    }[]>;
    getLeadStages(): {
        stages: ("LEADS_RECEIVED" | "CALL_REQUESTED" | "CALL_ATTEMPT" | "CALL_ANSWERED" | "SETTER_NO_SHOW" | "FOLLOW_UP" | "RV0_PLANNED" | "RV0_HONORED" | "RV0_NO_SHOW" | "RV0_CANCELED" | "RV1_PLANNED" | "RV1_HONORED" | "RV1_NO_SHOW" | "RV1_POSTPONED" | "RV1_CANCELED" | "RV2_PLANNED" | "RV2_HONORED" | "RV2_NO_SHOW" | "RV2_POSTPONED" | "RV2_CANCELED" | "NOT_QUALIFIED" | "LOST" | "WON")[];
    };
    create(body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: import("@prisma/client/runtime/library").JsonValue;
        updatedAt: Date;
    }>;
    get(id: string): Promise<{
        leadStages: ("LEADS_RECEIVED" | "CALL_REQUESTED" | "CALL_ATTEMPT" | "CALL_ANSWERED" | "SETTER_NO_SHOW" | "FOLLOW_UP" | "RV0_PLANNED" | "RV0_HONORED" | "RV0_NO_SHOW" | "RV0_CANCELED" | "RV1_PLANNED" | "RV1_HONORED" | "RV1_NO_SHOW" | "RV1_POSTPONED" | "RV1_CANCELED" | "RV2_PLANNED" | "RV2_HONORED" | "RV2_NO_SHOW" | "RV2_POSTPONED" | "RV2_CANCELED" | "NOT_QUALIFIED" | "LOST" | "WON")[];
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: import("@prisma/client/runtime/library").JsonValue;
        updatedAt: Date;
    }>;
    update(id: string, body: {
        name?: string;
        status?: 'OFF' | 'DRY_RUN' | 'ON';
        mappingJson?: any;
    }): Promise<{
        ok: boolean;
        id: string;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    hardDeleteLead(id: string): Promise<{
        ok: boolean;
        deletedId: string;
    }>;
    duplicate(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: import("@prisma/client/runtime/library").JsonValue;
        updatedAt: Date;
    }>;
    events(id: string, limit?: string): Promise<{
        error: string | null;
        id: string;
        result: import("@prisma/client/runtime/library").JsonValue;
        status: string;
        receivedAt: Date;
        payload: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    replay(eventId: string): Promise<{
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
