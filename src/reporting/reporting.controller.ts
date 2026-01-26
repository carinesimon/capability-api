// backend/src/modules/reporting/reporting.controller.ts
// backend/src/modules/reporting/reporting.controller.ts
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ReportingService } from './reporting.service';
@Controller()
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  /* --------- Bloc /reporting --------- */
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.summary(from, to, sourcesCsv, sourcesExcludeCsv);
  }

  @Post('reporting/cohort-status')
  async cohortStatus(
    @Body()
    body: {
      cohortFrom: string;
      cohortTo: string;
      asOf: string;
      tz?: string;
      sourcesCsv?: string;
      sourcesExcludeCsv?: string;
      setterIdsCsv?: string;
      closerIdsCsv?: string;
    },
  ) {
    return this.reporting.cohortStatus(body);
  }

  /* --------- Budgets (comptable) --------- */

  @Get('reporting/budget')
  async getBudgets() {
    // Retourne la liste des budgets hebdos, utilisée par BudgetPanel
    return this.reporting.listWeeklyBudgets();
  }

  @Post('reporting/budget')
  async upsertBudget(
    @Body()
    body: {
      weekStartISO: string; // ex: '2025-11-24'
      amount: number; // ex: 500
    },
  ) {
    const weekStartISO = body.weekStartISO;
    const parsedAmount = Number(body.amount) || 0;

    const budget = await this.reporting.upsertWeeklyBudget(
      weekStartISO,
      parsedAmount,
    );

    return { ok: true, budget };
  }

  @Get('reporting/sources')
  async listSources(
    @Query('search') search?: string,
    @Query('includeUnknown') includeUnknownStr?: string,
    @Query('withCounts') withCountsStr?: string,
    @Query('withLastSeen') withLastSeenStr?: string,
  ) {
    const includeUnknown =
      includeUnknownStr === '1' || includeUnknownStr === 'true';
    const withCounts = withCountsStr === '1' || withCountsStr === 'true';
    const withLastSeen = withLastSeenStr === '1' || withLastSeenStr === 'true';
    return this.reporting.listReportingSources({
      search,
      includeUnknown,
      withCounts,
      withLastSeen,
    });
  }

  @Get('reporting/leads-received')
  async getLeadsReceived(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.leadsReceived(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  // ✅ corriger le chemin + utiliser this.reporting
  @Get('reporting/spotlight-setters')
  spotlightSetters(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.spotlightSetters(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  // ✅ corriger le chemin + utiliser this.reporting
  @Get('reporting/spotlight-closers')
  spotlightClosers(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.spotlightClosers(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  // ===== EXPORTS SPOTLIGHT =====
  @Get('reporting/export/spotlight-setters.csv')
  async exportSpotlightSettersCsv(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
    @Res() res?: any,
  ) {
    const buf = await this.reporting.exportSpotlightSettersCSV({
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="spotlight_setters_${from || 'from'}_${to || 'to'}.csv"`,
    );
    return res.send(buf);
  }

  @Get('reporting/export/spotlight-closers.csv')
  async exportSpotlightClosersCsv(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
    @Res() res?: any,
  ) {
    const buf = await this.reporting.exportSpotlightClosersCSV({
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="spotlight_closers_${from || 'from'}_${to || 'to'}.csv"`,
    );
    return res.send(buf);
  }

  @Get('reporting/export/spotlight-setters.pdf')
  async exportSpotlightSettersPdf(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
    @Res() res?: any,
  ) {
    const buf = await this.reporting.exportSpotlightSettersPDF({
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="spotlight_setters_${from || 'from'}_${to || 'to'}.pdf"`,
    );
    return res.send(buf);
  }

  @Get('reporting/export/spotlight-closers.pdf')
  async exportSpotlightClosersPdf(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
    @Res() res?: any,
  ) {
    const buf = await this.reporting.exportSpotlightClosersPDF({
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="spotlight_closers_${from || 'from'}_${to || 'to'}.pdf"`,
    );
    return res.send(buf);
  }

  @Get('reporting/sales-weekly')
  async getSalesWeekly(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.salesWeekly(from, to, sourcesCsv, sourcesExcludeCsv);
  }

  @Get('reporting/setters')
  async getSetters(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.settersReport(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  @Get('reporting/closers')
  async getClosers(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.closersReport(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  @Get('reporting/duos')
  async getDuos(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.duosReport(from, to, sourcesCsv, sourcesExcludeCsv);
  }

  @Get('reporting/weekly-ops')
  async getWeeklyOps(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const rows = await this.reporting.weeklySeries(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
    return { ok: true as const, rows };
  }

  @Get('reporting/funnel')
  async getFunnel(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.funnel(from, to, sourcesCsv, sourcesExcludeCsv);
  }

  @Get('reporting/pipeline-metrics')
  async getPipelineMetrics(
    @Query('keys') keys?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('mode') mode?: 'entered' | 'current',
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const list = (keys || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    return this.reporting.pipelineMetrics({
      keys: list,
      from,
      to,
      mode,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  /* --------- DRILLS --------- */
  @Get('reporting/drill/leads-received')
  async drillLeads(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillLeadsReceived({
      from,
      to,
      limit,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  @Get('reporting/drill/won')
  async drillWon(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillWon({
      from,
      to,
      limit,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  @Get('reporting/drill/appointments')
  async drillAppointments(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'RV0' | 'RV1' | 'RV2',
    @Query('status')
    status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED',
    @Query('userId') userId?: string,
    @Query('limit') limitStr?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillAppointments({
      from,
      to,
      type,
      status,
      userId,
      limit,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  @Get('reporting/drill/call-requests')
  async drillCallRequests(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillCallRequests({
      from,
      to,
      limit,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  @Get('reporting/drill/calls')
  async drillCalls(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('answered') answeredStr?: string,
    @Query('setterNoShow') setterNoShowStr?: string,
    @Query('limit') limitStr?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const answered = answeredStr === '1' || answeredStr === 'true';
    const setterNoShow = setterNoShowStr === '1' || setterNoShowStr === 'true';
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillCalls({
      from,
      to,
      answered,
      setterNoShow,
      limit,
      sourcesCsv,
      sourcesExcludeCsv,
    });
  }

  /* --------- Bloc /metrics --------- */
  @Get('metrics/stage-series')
  async metricStageSeries(
    @Query('stage') stage?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    if (!stage) return { total: 0, byDay: [] };
    const tz = _tz ?? 'Europe/Paris';
    return this.reporting.stageSeries(
      stage,
      from,
      to,
      tz,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  @Get('metrics/leads-by-day')
  async leadsByDay(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    return this.reporting.leadsReceived(
      from,
      to,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }

  @Get('reporting/metrics/canceled-daily')
  async canceledDaily(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tz') _tz?: string,
    @Query('sourcesCsv') sourcesCsv?: string,
    @Query('sourcesExcludeCsv') sourcesExcludeCsv?: string,
  ) {
    const tz = _tz ?? 'Europe/Paris';
    return this.reporting.canceledDaily(
      from,
      to,
      tz,
      sourcesCsv,
      sourcesExcludeCsv,
    );
  }
}
