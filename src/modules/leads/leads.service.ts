import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';
import { StageEventsService } from './stage-events.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private stageEvents: StageEventsService,
  ) {}

  /** Déplace un lead vers un stage (et log l’event) */
  async updateLeadStage(
    leadId: string,
    toStage: LeadStage,
    source?: string,
    externalId?: string
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { stage: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.stageEvents.recordStageEntry({
      leadId,
      fromStage: lead.stage,
      toStage,
      source,
      externalId,
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: toStage,
        stageUpdatedAt: new Date(),
        boardColumnKey: null,
      },
    });

    return { ok: true };
  }

  /** Déplace un lead vers une colonne “libre” (board), sans StageEvent */
  async moveToBoardColumn(leadId: string, columnKey: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { boardColumnKey: columnKey, stageUpdatedAt: new Date() },
    });
    return { ok: true };
  }

  /** Suppression d’un lead */
  async deleteLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.lead.delete({ where: { id: leadId } });
    return { ok: true };
  }
  
}
