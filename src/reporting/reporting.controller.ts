import { Controller, Get, Query, Header } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  // Utilitaires anti-cache pour toutes les routes data
  private static readonly NO_CACHE = {
    cache: 'no-store, no-cache, must-revalidate, proxy-revalidate',
    pragma: 'no-cache',
    expires: '0',
  };

  // ===== KPIs déjà utilisés par le front =====
  @Get('summary')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.summary(from, to);
  }

  @Get('leads-received')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  leadsReceived(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.leadsReceived(from, to);
  }

  @Get('sales-weekly')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  salesWeekly(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.salesWeekly(from, to);
  }

  @Get('setters')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  setters(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.settersReport(from, to);
  }

  @Get('closers')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  closers(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.closersReport(from, to);
  }

  @Get('duos')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  async duos(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('top') top?: string,
  ) {
    const n = Math.max(1, Math.min(50, Number(top) || 10));
    return this.reporting.duosReport(from, to, n);
  }

  // ====== Métriques pipeline basées uniquement sur les STAGES ======
  @Get('pipeline-metrics')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  pipelineMetrics(
    @Query('keys') keysCsv: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('mode') mode: 'entered' | 'current' = 'entered',
  ) {
    const keys = (keysCsv || '').split(',').map(s => s.trim()).filter(Boolean);
    return this.reporting.pipelineMetrics({ keys, from, to, mode });
  }

  // Semaine par semaine (entered par défaut)
  @Get('weekly-ops')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  weeklyOps(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.weeklySeries(from, to).then(rows => ({ ok: true, rows }));
  }

  /* ===== METRICS JOURNALIÈRES ===== */
  @Get('metric/call-requests')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  metricCallRequests(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCallRequests(from, to);
  }

  @Get('metric/calls')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  metricCalls(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCalls(from, to);
  }

  @Get('metric/calls-answered')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  metricCallsAnswered(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.metricCallsAnswered(from, to);
  }

  // ===== Funnel agrégé =====
  @Get('funnel')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  funnel(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reporting.funnel(from, to);
  }

  // ===== DRILLS =====
  @Get('drill/appointments')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
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
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  drillWon(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillWon({ from, to, limit: Number(limit) } as any);
  }

  @Get('drill/leads-received')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  drillLeadsReceived(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillLeadsReceived({ from, to, limit: Number(limit) } as any);
  }

  @Get('drill/call-requests')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
  drillCallRequests(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '2000',
  ) {
    return this.reporting.drillCallRequests({ from, to, limit: Number(limit) });
  }

  @Get('drill/calls')
  @Header('Cache-Control', ReportingController.NO_CACHE.cache)
  @Header('Pragma', ReportingController.NO_CACHE.pragma)
  @Header('Expires', ReportingController.NO_CACHE.expires)
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
