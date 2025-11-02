import { PrismaService } from '../../prisma/prisma.service';
import { StageEventsService } from '../../modules/leads/stage-events.service';
type InboxItem = {
    id: string;
    receivedAt: string;
    contentType: string;
    headers: any;
    query: any;
    raw: string;
    parsed: any;
    hash: string;
};
export declare class GhlService {
    private prisma;
    private readonly stageEvents;
    constructor(prisma: PrismaService, stageEvents: StageEventsService);
    deduplicate(eventId?: string): Promise<void>;
    upsertContact(args: {
        firstName?: string;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        tag?: string | null;
        sourceTag?: string | null;
        ghlContactId?: string | null;
    }): Promise<any>;
    upsertOpportunity(args: {
        contactEmail?: string | null;
        ghlContactId?: string | null;
        amount?: number | null;
        stage?: string | null;
        saleValue?: number | null;
    }): Promise<{
        id: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        stage: import("@prisma/client").$Enums.LeadStage;
        source: string | null;
        ghlContactId: string | null;
        phone: string | null;
        tag: string | null;
        stageUpdatedAt: Date;
        stageId: string | null;
        boardColumnKey: string | null;
        opportunityValue: number | null;
        saleValue: number | null;
        setterId: string | null;
        closerId: string | null;
    }>;
    upsertAppointment(args: {
        id?: string | null;
        type?: string | null;
        status?: string | null;
        startTime?: string | null;
        contactEmail?: string | null;
        ghlContactId?: string | null;
        ownerEmail?: string | null;
    }): Promise<any>;
    captureInbox(args: {
        raw: string;
        headers: any;
        query: any;
        contentType: string;
    }): Promise<InboxItem>;
    listInbox(limit?: number): Promise<{
        ok: boolean;
        items: Pick<InboxItem, "id" | "receivedAt" | "contentType">[];
    }>;
    getInboxItem(id: string): Promise<InboxItem>;
    tryAutoProcess(item: InboxItem): Promise<void>;
    processWithMapping(inboxId: string, mapping: Record<string, string>, defaults?: Record<string, any>): Promise<{
        ok: boolean;
        lead: any;
    }>;
    private upsertLead;
}
export {};
