import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentType } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        type: dto.type,
        status: dto.status,
        scheduledAt: new Date(dto.scheduledAt),
        lead: { connect: { id: dto.leadId } },
        user: { connect: { id: dto.userId } },
      },
      include: { lead: true, user: true },
    });
  }

  findAll(params?: { from?: Date; to?: Date; userId?: string; type?: AppointmentType }) {
    const { from, to, userId, type } = params ?? {};
    return this.prisma.appointment.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
        ...(from || to ? { scheduledAt: { gte: from, lte: to } } : {}),
      },
      orderBy: { scheduledAt: 'desc' },
      include: { lead: true, user: true },
    });
  }

  /** Temps de 1er contact (minutes) pour un lead = premier RV0 - createdAt(lead) */
  async timeToFirstContactMinutes(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return null;

    const firstRv0 = await this.prisma.appointment.findFirst({
      where: { leadId, type: 'RV0' },
      orderBy: { scheduledAt: 'asc' },
    });
    if (!firstRv0) return null;

    const diffMs = firstRv0.scheduledAt.getTime() - lead.createdAt.getTime();
    return Math.round(diffMs / 60000); // minutes
  }
}
