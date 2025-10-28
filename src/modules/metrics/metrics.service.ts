// src/modules/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStage } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compte le nombre d'entrées (LeadEvent) par stage d'entrée (stocké dans `type`)
   * entre start et end. `stages` est optionnel (filtre).
   */
  async funnelTotals(params: { start: Date; end: Date; stages?: LeadStage[] }) {
    const { start, end, stages } = params;

    const rows = await this.prisma.leadEvent.groupBy({
      by: ['type'],
      where: {
        occurredAt: { gte: start, lt: end },
        ...(stages ? { type: { in: stages as unknown as string[] } } : {}),
      },
      _count: { _all: true },
    });

    // On retourne un record { [stage: string]: number }
    return Object.fromEntries(rows.map((r) => [r.type as string, r._count._all]));
  }
}
