import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';

@Injectable()
export class StageEventsService {
  constructor(private prisma: PrismaService) {}

  async recordStageEntry(opts: {
    leadId: string;
    fromStage?: LeadStage | null;
    toStage: LeadStage;
    source?: string;
    externalId?: string | null;
    occurredAt?: Date;
  }) {
    const { leadId, fromStage = null, toStage, source, externalId, occurredAt } = opts;

    const when = occurredAt ?? new Date();
    const minuteStart = new Date(when); minuteStart.setSeconds(0, 0);
    const minuteEnd = new Date(minuteStart); minuteEnd.setSeconds(59, 999);

    const existing = await this.prisma.leadEvent.findFirst({
      where: {
        leadId,
        type: toStage,
        occurredAt: { gte: minuteStart, lte: minuteEnd },
      },
      select: { id: true },
    });
    if (existing) return null;

    return this.prisma.leadEvent.create({
      data: {
        leadId,
        type: toStage,
        occurredAt: when,
        meta: {
          fromStage,
          toStage,
          source: source ?? null,
          externalId: externalId ?? null,
        },
      },
    });
  }
}
