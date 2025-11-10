import { AttributionService } from './attribution.service';
export declare class AttributionController {
    private readonly service;
    constructor(service: AttributionService);
    ensure(leadId: string): Promise<({
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
}
