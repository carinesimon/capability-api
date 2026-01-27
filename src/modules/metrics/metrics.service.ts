// backend/src/modules/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma, LeadStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function parseCsv(value?: string): string[] {
  if (!value) return [];
  const unique = new Set(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  return Array.from(unique);
}

function buildLeadSourceWhere(
  sourcesCsv?: string,
  sourcesExcludeCsv?: string,
): Prisma.LeadWhereInput {
  const includes = parseCsv(sourcesCsv);
  const excludes = parseCsv(sourcesExcludeCsv);
  const clauses: Prisma.LeadWhereInput[] = [];

  if (includes.length) {
    clauses.push({ source: { in: includes } });
  }

  if (excludes.length) {
    clauses.push({ source: { notIn: excludes } });
  }

  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

function buildLeadWhere(params: {
  sourcesCsv?: string;
  sourcesExcludeCsv?: string;
  setterIdsCsv?: string;
  closerIdsCsv?: string;
}): Prisma.LeadWhereInput {
  const clauses: Prisma.LeadWhereInput[] = [];
  const sourceWhere = buildLeadSourceWhere(
    params.sourcesCsv,
    params.sourcesExcludeCsv,
  );
  if (Object.keys(sourceWhere).length) {
    clauses.push(sourceWhere);
  }
  const setterIds = parseCsv(params.setterIdsCsv);
  if (setterIds.length) {
    clauses.push({ setterId: { in: setterIds } });
  }
  const closerIds = parseCsv(params.closerIdsCsv);
  if (closerIds.length) {
    clauses.push({ closerId: { in: closerIds } });
  }
  if (!clauses.length) return {};
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

/**
 * Sortie du funnel : un simple Record<string, number>
 * ex: { LEADS_RECEIVED: 42, CALL_REQUESTED: 10, RV1_PLANNED: 5, ... }
 */
export type FunnelTotals = Record<string, number>;

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Règles :
   * - LEADS_RECEIVED : nb de leads créés dans la période [start, end)
   * - toutes les autres clés = valeurs de LeadStage (CALL_REQUESTED, RV0_PLANNED, WON, etc.)
   *   comptées à partir de StageEvent, en prenant 1 event max par lead & par stage.
   *
   * Comme ton StageEventsService déduplique par (leadId|toStage),
   * il ne peut y avoir qu’un seul StageEvent par lead/stage dans toute l’histoire.
   * Donc un simple COUNT(*) sur StageEvent.toStage dans la période suffit.
   */
  async funnelTotals(params: { start: Date; end: Date }): Promise<FunnelTotals> {
    const { start, end } = params;

    // 1) Leads reçus = leads créés dans la période
    const leadsReceived = await this.prisma.lead.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    // 2) Entrées dans les stages = StageEvent.toStage dans la période,
    //    chaque ligne = 1 lead max (grâce au dedup côté StageEventsService).
    const rows = await this.prisma.stageEvent.groupBy({
      by: ['toStage'],
      where: {
        occurredAt: {
          gte: start,
          lt: end,
        },
      },
      _count: {
        _all: true,
      },
    });

    const out: FunnelTotals = {};

    // Initialise toutes les valeurs de l'enum LeadStage à 0
    // (CALL_REQUESTED, CALL_ATTEMPT, RV0_PLANNED, RV1_HONORED, WON, etc.)
    for (const s of Object.values(LeadStage)) {
      out[s] = 0;
    }

    // Applique les agrégats réellement présents dans la période
    for (const row of rows) {
      out[row.toStage] = row._count._all;
    }

    // Ajout de la métrique "Leads reçus"
    out.LEADS_RECEIVED = leadsReceived;

    return out;
  }

  /**
   * Leads créés par jour sur [start, end)
   */
  async leadsByDay(params: { start: Date; end: Date }) {
    const { start, end } = params;

    const rows = await this.prisma.lead.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (const r of rows) {
      const d = r.createdAt;
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }

    const byDay = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));

    return {
      total: rows.length,
      byDay,
    };
  }

  /**
   * Série par jour pour un stage donné (CALL_REQUESTED, CALL_ATTEMPT, RV0_NO_SHOW, etc.)
   * Basé sur StageEvent (toStage), période [start, end)
   * → 1 event max par lead/stage (grâce au StageEvent.upsert)
   */
  async stageSeriesByDay(params: {
    start: Date;
    end: Date;
    stage: LeadStage;
    sourcesCsv?: string;
    sourcesExcludeCsv?: string;
    setterIdsCsv?: string;
    closerIdsCsv?: string;
  }) {
    const {
      start,
      end,
      stage,
      sourcesCsv,
      sourcesExcludeCsv,
      setterIdsCsv,
      closerIdsCsv,
    } = params;

    const events = await this.prisma.stageEvent.findMany({
      where: {
        toStage: stage,
        occurredAt: {
          gte: start,
          lt: end,
        },
        lead: buildLeadWhere({
          sourcesCsv,
          sourcesExcludeCsv,
          setterIdsCsv,
          closerIdsCsv,
        }),
      },
      select: { occurredAt: true },
    });

    const buckets = new Map<string, number>();
    for (const ev of events) {
      const d = ev.occurredAt;
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }

    const byDay = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));

    return {
      total: events.length,
      byDay,
    };
  }

  /**
 * Annulations par jour (pile RV0_CANCELED / RV1_CANCELED / RV2_CANCELED + total)
 * Période [start, end)
 */
async canceledByDay(params: { start: Date; end: Date }) {
  const { start, end } = params;

  const events = await this.prisma.stageEvent.findMany({
    where: {
      toStage: { in: ['RV0_CANCELED', 'RV1_CANCELED', 'RV2_CANCELED'] as any },
      occurredAt: { gte: start, lt: end },
    },
    select: { toStage: true, occurredAt: true },
  });

  // Pivot par jour
  type Row = {
    day: string;
    RV0_CANCELED: number;
    RV1_CANCELED: number;
    RV2_CANCELED: number;
    total: number;
  };
  const map = new Map<string, Row>();

  for (const ev of events) {
    const d = ev.occurredAt;
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const row = map.get(day) ?? { day, RV0_CANCELED: 0, RV1_CANCELED: 0, RV2_CANCELED: 0, total: 0 };
    if (ev.toStage === 'RV0_CANCELED') row.RV0_CANCELED += 1;
    if (ev.toStage === 'RV1_CANCELED') row.RV1_CANCELED += 1;
    if (ev.toStage === 'RV2_CANCELED') row.RV2_CANCELED += 1;
    row.total = row.RV0_CANCELED + row.RV1_CANCELED + row.RV2_CANCELED;
    map.set(day, row);
  }

  const byDay = Array.from(map.values()).sort((a,b) => a.day.localeCompare(b.day));
  const total = byDay.reduce((s, r) => s + r.total, 0);

  return { total, byDay };
}

}

