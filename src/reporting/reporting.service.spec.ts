import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, AppointmentType, Role } from '@prisma/client';

type Range = { from?: Date; to?: Date };
function range(from?: string, to?: string): Range {
  return { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined };
}
function between(field: 'createdAt' | 'scheduledAt', r: Range) {
  if (!r.from && !r.to) return {};
  return { [field]: { gte: r.from, lte: r.to } } as any;
}

type SetterRow = {
  userId: string;
  name: string;
  email: string;
  leadsReceived: number;
  rv0Count: number;
  rv1FromHisLeads: number;
  ttfcAvgMinutes: number | null;
  revenueFromHisLeads: number;
  cpl: number | null;
  cpRv0: number | null;
  cpRv1: number | null;
  roas: number | null;
};

type CloserRow = {
  userId: string;
  name: string;
  email: string;
  rv1Planned: number;
  rv1Honored: number;
  rv1NoShow: number;
  rv2Planned: number;
  rv2Honored: number;
  salesClosed: number;
  revenueTotal: number;
  rosPlanned: number | null;
  rosHonored: number | null;
};

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  // ---- SETTERS ----
  async settersReport(from?: string, to?: string, userId?: string): Promise<SetterRow[]> {
    const r = range(from, to);

    const setters = await this.prisma.user.findMany({
      where: { role: Role.SETTER, isActive: true, ...(userId ? { id: userId } : {}) },
      select: { id: true, firstName: true, email: true },
      orderBy: { firstName: 'asc' },
    });

    const spendAgg = await this.prisma.budget.aggregate({
      _sum: { amount: true },
      where: (r.from || r.to)
        ? {
            OR: [
              { period: 'WEEKLY', weekStart: { gte: r.from ?? undefined, lte: r.to ?? undefined } },
              { period: 'MONTHLY', monthStart: { gte: r.from ?? undefined, lte: r.to ?? undefined } },
            ],
          }
        : undefined,
    });
    const spend = spendAgg._sum.amount ?? 0;

    const rows: SetterRow[] = [];
    for (const s of setters) {
      const leads = await this.prisma.lead.findMany({
        where: { assignedTo: s.id, ...between('createdAt', r) },
        select: { id: true, createdAt: true },
      });
      const leadIds = leads.map((l) => l.id);
      const leadsReceived = leadIds.length;

      const rv0Count = await this.prisma.appointment.count({
        where: { userId: s.id, type: AppointmentType.RV0, ...between('scheduledAt', r) },
      });

      const rv1FromHisLeads = leadIds.length
        ? await this.prisma.appointment.count({
            where: { type: AppointmentType.RV1, leadId: { in: leadIds }, ...between('scheduledAt', r) },
          })
        : 0;

      const revenueAgg = leadIds.length
        ? await this.prisma.contract.aggregate({
            _sum: { total: true },
            where: { leadId: { in: leadIds }, ...between('createdAt', r) },
          })
        : { _sum: { total: 0 } as any };
      const revenueFromHisLeads = revenueAgg._sum.total ?? 0;

      let ttfcSum = 0,
        ttfcN = 0;
      for (const lead of leads) {
        const firstRv0 = await this.prisma.appointment.findFirst({
          where: { leadId: lead.id, type: AppointmentType.RV0 },
          orderBy: { scheduledAt: 'asc' },
          select: { scheduledAt: true },
        });
        if (firstRv0) {
          const diffMs = firstRv0.scheduledAt.getTime() - lead.createdAt.getTime();
          ttfcSum += Math.round(diffMs / 60000);
          ttfcN += 1;
        }
      }
      const ttfcAvgMinutes = ttfcN ? Math.round(ttfcSum / ttfcN) : null;

      const cpl = leadsReceived ? Number((spend / leadsReceived).toFixed(2)) : null;
      const cpRv0 = rv0Count ? Number((spend / rv0Count).toFixed(2)) : null;
      const cpRv1 = rv1FromHisLeads ? Number((spend / rv1FromHisLeads).toFixed(2)) : null;
      const roas = spend ? Number((revenueFromHisLeads / spend).toFixed(2)) : null;

      rows.push({
        userId: s.id,
        name: s.firstName,
        email: s.email,
        leadsReceived,
        rv0Count,
        rv1FromHisLeads,
        ttfcAvgMinutes,
        revenueFromHisLeads,
        cpl,
        cpRv0,
        cpRv1,
        roas,
      });
    }

    return rows;
  }

  // ---- CLOSERS ----
  async closersReport(from?: string, to?: string, userId?: string): Promise<CloserRow[]> {
    const r = range(from, to);

    const closers = await this.prisma.user.findMany({
      where: { role: Role.CLOSER, isActive: true, ...(userId ? { id: userId } : {}) },
      select: { id: true, firstName: true, email: true },
      orderBy: { firstName: 'asc' },
    });

    const results: CloserRow[] = [];
    for (const c of closers) {
      const rv1Planned = await this.prisma.appointment.count({
        where: { userId: c.id, type: AppointmentType.RV1, ...between('scheduledAt', r) },
      });
      const rv1Honored = await this.prisma.appointment.count({
        where: { userId: c.id, type: AppointmentType.RV1, status: AppointmentStatus.HONORED, ...between('scheduledAt', r) },
      });
      const rv1NoShow = await this.prisma.appointment.count({
        where: { userId: c.id, type: AppointmentType.RV1, status: AppointmentStatus.NO_SHOW, ...between('scheduledAt', r) },
      });
      const rv2Planned = await this.prisma.appointment.count({
        where: { userId: c.id, type: AppointmentType.RV2, ...between('scheduledAt', r) },
      });
      const rv2Honored = await this.prisma.appointment.count({
        where: { userId: c.id, type: AppointmentType.RV2, status: AppointmentStatus.HONORED, ...between('scheduledAt', r) },
      });

      const salesClosed = await this.prisma.contract.count({
        where: { userId: c.id, ...between('createdAt', r) },
      });
      const revenueAgg = await this.prisma.contract.aggregate({
        _sum: { total: true },
        where: { userId: c.id, ...between('createdAt', r) },
      });
      const revenueTotal = revenueAgg._sum.total ?? 0;

      const rosPlanned = rv1Planned ? Number((revenueTotal / rv1Planned).toFixed(2)) : null;
      const rosHonored = rv1Honored ? Number((revenueTotal / rv1Honored).toFixed(2)) : null;

      results.push({
        userId: c.id,
        name: c.firstName,
        email: c.email,
        rv1Planned,
        rv1Honored,
        rv1NoShow,
        rv2Planned,
        rv2Honored,
        salesClosed,
        revenueTotal,
        rosPlanned,
        rosHonored,
      });
    }

    return results;
  }
}
