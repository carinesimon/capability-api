import { PrismaService } from '../prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';
export declare class WebhooksService {
    private prisma;
    private attribution;
    constructor(prisma: PrismaService, attribution: AttributionService);
    private verifySignature;
    private hashPayload;
    private externalIdFrom;
    private getByPath;
    private normEmail;
    private findUserByEmailInsensitive;
    private findUserByNameApprox;
    private pickNextActiveSetter;
    private resolveAssignmentFromMapping;
    ingestLead(payload: {
        firstName: string;
        lastName?: string;
        email?: string | null;
        phone?: string | null;
        tag?: string | null;
        ghlContactId?: string | null;
        opportunityValue?: number | null;
    }): Promise<({
        setter: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            passwordHash: string | null;
            lastLoginAt: Date | null;
        } | null;
        closer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            passwordHash: string | null;
            lastLoginAt: Date | null;
        } | null;
    } & {
        id: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        createdAt: Date;
        updatedAt: Date;
        stage: import("@prisma/client").$Enums.LeadStage;
        ghlContactId: string | null;
        phone: string | null;
        tag: string | null;
        source: string | null;
        stageUpdatedAt: Date;
        stageId: string | null;
        boardColumnKey: string | null;
        opportunityValue: number | null;
        saleValue: number | null;
        setterId: string | null;
        closerId: string | null;
    }) | null>;
    private toAppointmentType;
    private toAppointmentStatus;
    private onAppointmentUpsert;
    private findUserByEmail;
    private resolveAssignmentFromPayload;
    handleGhlWebhook(rawBody: string, headers: Record<string, any>, body: any): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
}
