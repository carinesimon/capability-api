import { PrismaService } from '../prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';
export declare class LeadsService {
    private prisma;
    private attribution;
    constructor(prisma: PrismaService, attribution: AttributionService);
    create(data: {
        firstName: string;
        lastName?: string;
        email?: string;
        tag?: string;
        setterId?: string;
    }): Promise<{
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
    } | null>;
    findAll(params?: {
        from?: Date;
        to?: Date;
    }): import("@prisma/client").Prisma.PrismaPromise<({
        appointments: {
            id: string;
            createdAt: Date;
            userId: string | null;
            leadId: string | null;
            provider: string;
            externalId: string;
            type: import("@prisma/client").$Enums.AppointmentType;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
        }[];
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
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__LeadClient<({
        appointments: {
            id: string;
            createdAt: Date;
            userId: string | null;
            leadId: string | null;
            provider: string;
            externalId: string;
            type: import("@prisma/client").$Enums.AppointmentType;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
        }[];
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
