import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentType } from '@prisma/client';
export declare class AppointmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateAppointmentDto): import("@prisma/client").Prisma.Prisma__AppointmentClient<{
        user: {
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
        lead: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        leadId: string | null;
        externalId: string;
        type: import("@prisma/client").$Enums.AppointmentType;
        provider: string;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        scheduledAt: Date;
        userId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(params?: {
        from?: Date;
        to?: Date;
        userId?: string;
        type?: AppointmentType;
    }): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
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
        lead: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date;
        leadId: string | null;
        externalId: string;
        type: import("@prisma/client").$Enums.AppointmentType;
        provider: string;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        scheduledAt: Date;
        userId: string | null;
    })[]>;
    timeToFirstContactMinutes(leadId: string): Promise<number | null>;
}
