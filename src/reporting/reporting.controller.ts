// backend/src/modules/reporting/reporting.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  /* --------- Résumé global --------- */
  @Get('summary')
  async getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.summary(from, to);
  }

  /* --------- Leads reçus (créations) --------- */
  @Get('leads-received')
  async getLeadsReceived(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.leadsReceived(from, to);
  }

  /* --------- CA / ventes par semaine (WON) --------- */
  @Get('sales-weekly')
  async getSalesWeekly(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.salesWeekly(from, to);
  }

  /* --------- Classement setters --------- */
  @Get('setters')
  async getSetters(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.settersReport(from, to);
  }

  /* --------- Classement closers --------- */
  @Get('closers')
  async getClosers(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.closersReport(from, to);
  }

  /* --------- Équipe de choc (duos setter × closer) --------- */
  @Get('duos')
  async getDuos(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reporting.duosReport(from, to);
  }

  /* --------- Weekly ops (RV0 / RV1 / RV2 / LOST / NOT_QUALIFIED) --------- */
  @Get('weekly-ops')
  async getWeeklyOps(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const rows = await this.reporting.weeklySeries(from, to);
    return { ok: true as const, rows };
  }

  /* --------- Drill: leads reçus --------- */
  @Get('drill/leads-received')
  async drillLeads(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillLeadsReceived({ from, to, limit });
  }

  /* --------- Drill: ventes (WON) --------- */
  @Get('drill/won')
  async drillWon(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillWon({ from, to, limit });
  }

  /* --------- Drill: appointments (RV0 / RV1 / RV2) --------- */
  @Get('drill/appointments')
  async drillAppointments(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'RV0' | 'RV1' | 'RV2',
    @Query('status') status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED',
    @Query('userId') userId?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillAppointments({ from, to, type, status, userId, limit });
  }

  /* --------- Drill: demandes d’appel --------- */
  @Get('drill/call-requests')
  async drillCallRequests(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Number(limitStr ?? 2000);
    return this.reporting.drillCallRequests({ from, to, limit });
  }

  /* --------- Drill: appels (passés / répondus / no-show setter) --------- */
  @Get('drill/calls')
  async drillCalls(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('answered') answeredStr?: string,
    @Query('setterNoShow') setterNoShowStr?: string,
    @Query('limit') limitStr?: string,
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
    });
  }
}
