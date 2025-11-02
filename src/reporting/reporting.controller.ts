import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  // ===== KPIs déjà utilisés par le front =====
  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.summary(from, to);
  }

  @Get('leads-received')
  leadsReceived(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.leadsReceived(from, to);
  }

  @Get('sales-weekly')
  salesWeekly(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.salesWeekly(from, to);
  }

  @Get('setters')
  setters(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.settersReport(from, to);
  }

  @Get('closers')
  closers(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.closersReport(from, to);
  }

  @Get('duos')
  async duos(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('top') top?: string,
  ) {
    const n = Math.max(1, Math.min(50, Number(top) || 10));
    return this.reporting.duosReport(from, to, n);
  }

  // ====== NOUVEAU : métriques pipeline basées uniquement sur les STAGES ======
  @Get('pipeline-metrics')
  pipelineMetrics(
    @Query('keys') keysCsv: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('mode') mode: 'entered' | 'current' = 'entered',
  ) {
    const keys = (keysCsv || '').split(',').map(s => s.trim()).filter(Boolean);
    return this.reporting.pipelineMetrics({ keys, from, to, mode });
  }

  // 🔥 NOUVEAU : compte tous les leads qui sont DÉJÀ passés au moins une fois dans chaque stage
  @Get('pipeline-stage-totals')
  pipelineStageTotals(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.pipelineStageTotals(from, to);
  }

  // Semaine par semaine (entered par défaut)
  @Get('weekly-ops')
  weeklyOps(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.weeklySeries(from, to).then(rows => ({ ok: true, rows }));
  }

  /* ===== METRICS JOURNALIÈRES ===== */
  @Get('metric/call-requests')
  metricCallRequests(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCallRequests(from, to);
  }

  @Get('metric/calls')
  metricCalls(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCalls(from, to);
  }

  @Get('metric/calls-answered')
  metricCallsAnswered(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCallsAnswered(from, to);
  }

  // ===== Funnel agrégé =====
  @Get('funnel')
  funnel(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.funnel(from, to);
  }

  // ===== DRILLS =====
  @Get('drill/appointments')
  drillAppointments(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'RV0'|'RV1'|'RV2',
    @Query('status') status?: 'HONORED'|'POSTPONED'|'CANCELED'|'NO_SHOW'|'NOT_QUALIFIED',
    @Query('userId') userId?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillAppointments({ from, to, type, status, userId, limit: Number(limit) });
  }

  @Get('drill/won')
  drillWon(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillWon({ from, to, limit: Number(limit) } as any);
  }

  @Get('drill/leads-received')
  drillLeadsReceived(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillLeadsReceived({ from, to, limit: Number(limit) } as any);
  }

  @Get('drill/call-requests')
  drillCallRequests(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillCallRequests({ from, to, limit: Number(limit) });
  }

  @Get('drill/calls')
  drillCalls(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('answered') answered?: string,
    @Query('setterNoShow') setterNoShow?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillCalls({
      from, to,
      answered: answered ? Boolean(Number(answered)) : false,
      setterNoShow: setterNoShow ? Boolean(Number(setterNoShow)) : false,
      limit: Number(limit),
    });
  }
}
