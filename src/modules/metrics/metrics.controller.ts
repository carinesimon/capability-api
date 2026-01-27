// backend/src/modules/metrics/metrics.controller.ts
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { LeadStage } from '@prisma/client';

function parseDateOrThrow(label: string, value?: string): Date {
  if (!value) {
    throw new BadRequestException(
      `Query param "${label}" est requis (YYYY-MM-DD)`,
    );
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new BadRequestException(
      `Query param "${label}" invalide : "${value}"`,
    );
  }
  return d;
}

function parseLeadStageOrThrow(value?: string): LeadStage {
  if (!value) {
    throw new BadRequestException('Query param "stage" est requis');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException('Query param "stage" est requis');
  }
  const isValidStage = Object.values(LeadStage).includes(trimmed as LeadStage);
  if (!isValidStage) {
    throw new BadRequestException(`Query param "stage" invalide : "${value}"`);
  }
  return trimmed as LeadStage;
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /**
   * GET /metrics/stages
   *
   * Retourne:
   * { stages: string[] }
   */
  @Get('stages')
  getStages() {
    return { stages: Object.values(LeadStage) };
  }

  /**
   * GET /metrics/funnel?from=2025-10-01&to=2025-10-31
   *
   * Retourne un objet de la forme:
   * {
   *   "LEADS_RECEIVED": 12,
   *   "CALL_REQUESTED": 5,
   *   "CALL_ATTEMPT": 10,
   *   "CALL_ANSWERED": 7,
   *   "RV0_PLANNED": 3,
   *   ...
   *   "WON": 2
   * }
   *
   * Le frontend (useFunnelMetrics) consomme directement cet objet.
   */
  @Get('funnel')
  async getFunnel(@Query('from') from?: string, @Query('to') to?: string) {
    const start = parseDateOrThrow('from', from);
    const endDate = parseDateOrThrow('to', to);

    // On veut un intervalle [start, endExclusive)
    const endExclusive = new Date(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    return this.metrics.funnelTotals({ start, end: endExclusive });
  }

  /**
   * GET /metrics/leads-by-day?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Retourne:
   * {
   *   total: number;
   *   byDay: Array<{ day: "2025-10-01", count: 3 }>
   * }
   */
  @Get('leads-by-day')
  async getLeadsByDay(@Query('from') from?: string, @Query('to') to?: string) {
    const start = parseDateOrThrow('from', from);
    const endDate = parseDateOrThrow('to', to);

    const endExclusive = new Date(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    return this.metrics.leadsByDay({ start, end: endExclusive });
  }

  /**
   * GET /metrics/stage-series?stage=CALL_REQUESTED&from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Série par jour pour un stage donné, basée sur StageEvent.toStage :
   * {
   *   total: number;
   *   byDay: Array<{ day: "2025-10-01", count: 4 }>
   * }
   *
   * Utilisé par :
   *  - Demandes d’appel par jour (CALL_REQUESTED)
   *  - Appels passés par jour (CALL_ATTEMPT)
   *  - Appels répondus par jour (CALL_ANSWERED)
   *  - RV0 no-show par jour (RV0_NO_SHOW) ensuite agrégé par semaine
   */
  @Get('stage-series')
  async getStageSeries(
    @Query('stage') stageStr?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
    @Query('setterIdsCsv') setterIdsCsv?: string,
    @Query('closerIdsCsv') closerIdsCsv?: string,
  ) {
    const stage = parseLeadStageOrThrow(stageStr);
    const start = parseDateOrThrow('from', from);
    const endDate = parseDateOrThrow('to', to);

    const endExclusive = new Date(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    return this.metrics.stageSeriesByDay({
      start,
      end: endExclusive,
      stage,
      sourcesCsv,
      sourcesExcludeCsv,
      setterIdsCsv,
      closerIdsCsv,
    });
  }

  /**
   * GET /metrics/canceled-by-day?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Retourne :
   * {
   *   total: number,
   *   byDay: [
   *     { day: "2025-11-01", RV0_CANCELED: 1, RV1_CANCELED: 2, RV2_CANCELED: 0, total: 3 },
   *     ...
   *   ]
   * }
   */
  @Get('canceled-by-day')
  async getCanceledByDay(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const start = parseDateOrThrow('from', from);
    const endDate = parseDateOrThrow('to', to);
    const endExclusive = new Date(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    return this.metrics.canceledByDay({ start, end: endExclusive });
  }
}

