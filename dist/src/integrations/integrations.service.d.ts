import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AutoAssignService } from './auto-assign.service';
import { StageEventsService } from '../modules/leads/stage-events.service';
type ReplayOptions = {
    mode?: 'upsert' | 'createNew';
};
export declare class IntegrationsService {
    private prisma;
    private readonly autoAssign;
    private readonly stageEvents;
    constructor(prisma: PrismaService, autoAssign: AutoAssignService, stageEvents: StageEventsService);
    createAutomation(name: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: Prisma.JsonValue;
        updatedAt: Date;
    }>;
    listAutomationsWithAbsoluteUrl(): Promise<{
        webhookUrl: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        routeKey: string;
    }[]>;
    getAutomation(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        routeKey: string;
        mappingJson: Prisma.JsonValue | null;
        rulesJson: Prisma.JsonValue | null;
        metaJson: Prisma.JsonValue | null;
    }>;
    decorateAutomationAbsolute(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: Prisma.JsonValue;
        updatedAt: Date;
    }>;
    getAutomationWithAbsoluteUrl(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: Prisma.JsonValue;
        updatedAt: Date;
    }>;
    updateAutomation(id: string, body: {
        name?: string;
        status?: 'OFF' | 'DRY_RUN' | 'ON';
        mappingJson?: any;
    }): Promise<{
        ok: boolean;
        id: string;
    }>;
    deleteAutomation(id: string): Promise<void>;
    duplicateAutomation(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.AutomationStatus;
        webhookUrl: string;
        mappingJson: Prisma.JsonValue;
        updatedAt: Date;
    }>;
    listEvents(automationId: string, limit: number): Promise<{
        error: string | null;
        result: Prisma.JsonValue;
        id: string;
        status: string;
        receivedAt: Date;
        payload: Prisma.JsonValue;
    }[]>;
    replayEvent(eventId: string, opts?: ReplayOptions): Promise<{
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
    receiveWebhook(routeKey: string, _contentType: string, payload: any): Promise<{
        id: string;
    }>;
    processAutomationHook(routeKeyStr: string, payload: any): Promise<{
        ok: boolean;
        ignored: boolean;
        reason: string;
        eventId: string;
        dryRun?: undefined;
        preview?: undefined;
        stage?: undefined;
        report?: undefined;
        leadId?: undefined;
    } | {
        ok: boolean;
        dryRun: boolean;
        preview: any;
        stage: import("@prisma/client").$Enums.LeadStage | undefined;
        report: any;
        eventId: string;
        ignored?: undefined;
        reason?: undefined;
        leadId?: undefined;
    } | {
        ok: boolean;
        leadId: any;
        stage: import("@prisma/client").$Enums.LeadStage | undefined;
        report: any;
        eventId: string;
        ignored?: undefined;
        reason?: undefined;
        dryRun?: undefined;
        preview?: undefined;
    }>;
    deleteLeadCompletely(leadId: string): Promise<{
        ok: boolean;
        deletedId: string;
    }>;
    private buildCreate;
    private buildUpdate;
    private connectActorsIfAny;
    private safeCreateLeadEvent;
    private stageToEvent;
    private hash;
    private applyMapping;
}
export {};
