import { AppointmentStatus, AppointmentType } from '@prisma/client';
export declare class CreateAppointmentDto {
    type: AppointmentType;
    status: AppointmentStatus;
    scheduledAt: string;
    leadId: string;
    userId: string;
    notes?: string;
}
