import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @IsEnum(AppointmentType) type: AppointmentType; // 'RV0' | 'RV1' | 'RV2'
  @IsEnum(AppointmentStatus) status: AppointmentStatus; // HONORED | POSTPONED | CANCELED | NO_SHOW | NOT_QUALIFIED
  @IsDateString() scheduledAt: string; // ISO string
  @IsString() leadId: string;
  @IsString() userId: string; // setter ou closer selon type
  @IsOptional() @IsString() notes?: string;
}
