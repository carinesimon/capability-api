import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentType } from '@prisma/client';

export declare class AppointmentsController {
    private readonly service;
    constructor(service: AppointmentsService);
    create(body: CreateAppointmentDto): import("@prisma/client").Prisma.Prisma__AppointmentClient<{
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
    findAll(from?: string, to?: string, userId?: string, type?: AppointmentType): import("@prisma/client").Prisma.PrismaPromise<({
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
    ttfc(leadId: string): Promise<{
        leadId: string;
        timeToFirstContactMinutes: number | null;
    }>;
}
