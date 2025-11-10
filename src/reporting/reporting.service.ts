import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentStatus,
  AppointmentType,
  BudgetPeriod,
  Role,
  LeadStage,
  CallOutcome,
} from '@prisma/client';

type Range = { from?: Date; to?: Date };
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* ---------------- Dates helpers (UTC) ---------------- */
function toUTCDateOnly(s?: string) {
  if (!s) return undefined;
  if (s.includes('T')) {
    const d = new Date(s);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
const startOfDayUTC = (s?: string) => (s ? toUTCDateOnly(s) : undefined);
function endOfDayUTC(s?: string) {
  if (!s) return undefined;
  const d0 = toUTCDateOnly(s)!;
  const d1 = new Date(d0.getTime());
  d1.setUTCHours(23, 59, 59, 999);
  return d1;
}
function toRange(from?: string, to?: string): Range {
  return { from: startOfDayUTC(from), to: endOfDayUTC(to) };
}
function between(
  field:
    | 'createdAt'
    | 'scheduledAt'
    | 'stageUpdatedAt'
    | 'occurredAt'
    | 'startedAt'
    | 'requestedAt',
  r: Range,
) {
  if (!r.from && !r.to) return {};
  return { [field]: { gte: r.from ?? undefined, lte: r.to ?? undefined } } as any;
}
function mondayOfUTC(d: Date) {
  const x = new Date(d);
  const w = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - w);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function sundayOfUTC(d: Date) {
  const m = mondayOfUTC(d);
  const s = new Date(m);
  s.setUTCDate(s.getUTCDate() + 6);
  s.setUTCHours(23, 59, 59, 999);
  return s;
}
function intersectWindow(aStart: Date, aEnd: Date, bStart?: Date, bEnd?: Date) {
  const s = new Date(Math.max(aStart.getTime(), (bStart ?? aStart).getTime()));
  const e = new Date(Math.min(aEnd.getTime(), (bEnd ?? aEnd).getTime()));
  return s > e ? null : { start: s, end: e };
}

/* ---------------- Types sortie (alignés au front) ---------------- */
type SetterRow = {
  userId: string;
  name: string;
  email: string;
  leadsReceived: number;
  rv0Count: number;
  rv1FromHisLeads: number;
  ttfcAvgMinutes: number | null;
  revenueFromHisLeads: number;
  spendShare: number | null;
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
  roasPlanned: number | null;
  roasHonored: number | null;
};
type LeadsReceivedOut = {
  total: number;
  byDay?: Array<{ day: string; count: number }>;
};
type SalesWeeklyItem = {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  count: number;
};
type SummaryOut = {
  period: { from?: string; to?: string };
  totals: {
    leads: number;
    revenue: number;
    salesCount: number;
    spend: number;
    roas: number | null;
    settersCount: number;
    closersCount: number;
    rv1Honored: number;
  };
};
type WeeklyOpsRow = {
  weekStart: string;
  weekEnd: string;
  rv0Planned: number;
  rv0Honored: number;
  rv0NoShow?: number;
  rv1Planned: number;
  rv1Honored: number;
  rv1NoShow: number;
  rv1Postponed?: number;
  rv2Planned: number;
  rv2Honored: number;
  rv2Postponed?: number;
  notQualified?: number;
  lost?: number;
};

/* ---------- Funnel ---------- */
type FunnelTotals = {
  leads: number;
  callRequests: number;
  callsTotal: number;
  callsAnswered: number;
  setterNoShow: number;
  rv0Planned: number;
  rv0Honored: number;
  rv0NoShow: number;
  rv1Planned: number;
  rv1Honored: number;
  rv1NoShow: number;
  rv2Planned: number;
  rv2Honored: number;
  notQualified: number;
  lost: number;
  wonCount: number;
};
type FunnelWeeklyRow = { weekStart: string; weekEnd: string } & FunnelTotals;
type FunnelOut = {
  period: { from?: string; to?: string };
  totals: FunnelTotals;
  weekly: FunnelWeeklyRow[];
};

/* ---------- Duos (setter × closer) ---------- */
type DuoRow = {
  setterId: string;
  setterName: string;
  setterEmail: string;
  closerId: string;
  closerName: string;
  closerEmail: string;
  salesCount: number;
  revenue: number;
  avgDeal: number;
  rv1Planned: number;
  rv1Honored: number;
  rv1HonorRate: number | null;
};

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  /* ---------------- Won (stages dynamiques gérés) ---------------- */
  private async wonStageIds(): Promise<string[]> {
    try {
      const rows = await this.prisma.stage.findMany({
        where: { isActive: true, isWon: true },
        select: { id: true },
      });
      return rows.map((r) => r.id);
    } catch {
      return [];
    }
  }
  private async wonFilter(r: Range) {
    const wonIds = await this.wonStageIds();
    const base: any = wonIds.length
      ? { stageId: { in: wonIds } }
      : { stage: LeadStage.WON as any };
    if (!r.from && !r.to) return base;
    return { AND: [base, between('stageUpdatedAt', r)] } as any;
  }

  /* ---------------- Budgets ---------------- */
  private async sumSpend(r: Range): Promise<number> {
    const budgets = await this.prisma.budget.findMany({
      where: { period: BudgetPeriod.WEEKLY },
    });
    if (!r.from && !r.to) {
      return budgets.reduce((s, b) => s + num(b.amount), 0);
    }
    let sum = 0;
    for (const b of budgets) {
      if (!b.weekStart) continue;
      const ws = mondayOfUTC(new Date(b.weekStart));
      const we = sundayOfUTC(new Date(b.weekStart));
      if ((r.from ? ws <= r.to! : true) && (r.to ? we >= r.from! : true)) {
        sum += num(b.amount);
      }
    }
    return sum;
  }

  /* ---------------- Leads reçus (créations) ---------------- */
  async leadsReceived(from?: string, to?: string): Promise<LeadsReceivedOut> {
    const r = toRange(from, to);
    const total = await this.prisma.lead.count({ where: between('createdAt', r) });

    const days: Array<{ day: string; count: number }> = [];
    if (r.from && r.to) {
      const start = new Date(r.from);
      const end = new Date(r.to);
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const d0 = new Date(d);
        d0.setUTCHours(0, 0, 0, 0);
        const d1 = new Date(d);
        d1.setUTCHours(23, 59, 59, 999);
        const count = await this.prisma.lead.count({
          where: { createdAt: { gte: d0, lte: d1 } },
        });
        days.push({ day: d0.toISOString(), count: num(count) });
      }
    }
    return { total: num(total), byDay: days.length ? days : undefined };
  }

  /* ---------------- Ventes (WON) + hebdo ---------------- */
  async salesWeekly(from?: string, to?: string): Promise<SalesWeeklyItem[]> {
    const r = toRange(from, to);
    const start = mondayOfUTC(r.from ?? new Date());
    const end = sundayOfUTC(r.to ?? new Date());
    const out: SalesWeeklyItem[] = [];
    for (let w = new Date(start); w <= end; w.setUTCDate(w.getUTCDate() + 7)) {
      const ws = mondayOfUTC(w);
      const we = sundayOfUTC(w);
      const where = await this.wonFilter({ from: ws, to: we });
      const agg = await this.prisma.lead.aggregate({
        _sum: { saleValue: true },
        _count: { _all: true },
        where,
      });
      out.push({
        weekStart: ws.toISOString(),
        weekEnd: we.toISOString(),
        revenue: num(agg._sum.saleValue ?? 0),
        count: num(agg._count._all ?? 0),
      });
    }
    return out;
  }

/* ---------------- Setters (TTFC basé sur LeadEvent + attribution via CallAttempt) ---------------- */
/* ---------------- Setters (TTFC + RV1_HONORED par stage) ---------------- */
/* ---------------- Setters (TTFC + RV1_HONORED via StageEvent) ---------------- */
async settersReport(from?: string, to?: string): Promise<SetterRow[]> {
  const r = toRange(from, to);
  const spend = await this.sumSpend(r);

  // Setters actifs
  const setters = await this.prisma.user.findMany({
    where: { role: Role.SETTER, isActive: true },
    select: { id: true, firstName: true, email: true, role: true },
    orderBy: { firstName: 'asc' },
  });
  const setterIds = new Set(setters.map((s) => s.id));

  // Tous les leads créés dans la période (pour leadsReceived + répartition budget)
  const allLeads = await this.prisma.lead.findMany({
    where: between('createdAt', r),
    select: { id: true, setterId: true, createdAt: true },
  });
  const totalLeads = allLeads.length;

  /* ========= NOUVEAU : RV1_HONORED par setter basé sur StageEvent =========
     - On regarde les StageEvent.toStage = RV1_HONORED
     - occurredAt dans [from;to]
     - On crédite le setter du lead (lead.setterId)
     - Si le lead bouge ensuite de colonne -> on ne perd PAS le crédit
  ========================================================================= */
  const rv1Events = await this.prisma.stageEvent.findMany({
    where: {
      toStage: LeadStage.RV1_HONORED,
      ...between('occurredAt', r),
    },
    select: {
      leadId: true,
      lead: {
        select: { setterId: true },
      },
    },
  });

  // Map setterId -> Set<leadId> (pour ne pas double compter un même lead)
  const rv1FromHisLeadsBySetter = new Map<string, Set<string>>();
  for (const ev of rv1Events) {
    if (!ev.lead || !ev.lead.setterId || !ev.leadId) continue;
    const sId = ev.lead.setterId;
    if (!rv1FromHisLeadsBySetter.has(sId)) {
      rv1FromHisLeadsBySetter.set(sId, new Set());
    }
    rv1FromHisLeadsBySetter.get(sId)!.add(ev.leadId);
  }

  /* =========================================================================
     TTFC = (première entrée en CALL_REQUESTED) -> (première entrée en CALL_ATTEMPT)
     - On prend les horodatages depuis LeadEvent (type)
     - Attribution au setter qui a passé le premier CallAttempt >= requestAt
       (fallback sur lead.setterId si on ne trouve pas de call)
     ========================================================================*/

  // 1) Première demande d’appel (CALL_REQUESTED) par lead dans [from;to]
  const reqEvents = await this.prisma.leadEvent.findMany({
    where: {
      type: 'CALL_REQUESTED',
      ...between('occurredAt', r),
    },
    orderBy: { occurredAt: 'asc' },
    select: { leadId: true, occurredAt: true },
  });
  const firstReqByLead = new Map<string, Date>();
  for (const ev of reqEvents) {
    if (!ev.leadId) continue;
    if (!firstReqByLead.has(ev.leadId)) firstReqByLead.set(ev.leadId, ev.occurredAt as any);
  }
  const leadsWithRequest = Array.from(firstReqByLead.keys());

  // 2) Première entrée en CALL_ATTEMPT APRÈS la demande, par lead
  const attemptEvents = leadsWithRequest.length
    ? await this.prisma.leadEvent.findMany({
        where: {
          type: 'CALL_ATTEMPT',
          leadId: { in: leadsWithRequest },
        },
        orderBy: { occurredAt: 'asc' },
        select: { leadId: true, occurredAt: true },
      })
    : [];
  const firstAttemptEventByLead = new Map<string, Date>();
  for (const ev of attemptEvents) {
    if (!ev.leadId) continue;
    const reqAt = firstReqByLead.get(ev.leadId);
    if (!reqAt) continue;
    if (ev.occurredAt < reqAt) continue;
    if (r.to && ev.occurredAt > r.to) continue;
    if (!firstAttemptEventByLead.has(ev.leadId)) {
      firstAttemptEventByLead.set(ev.leadId, ev.occurredAt as any);
    }
  }

  // 3) Attribution du TTFC au setter qui a passé le premier CallAttempt >= requestAt.
  type TtfcAgg = { sum: number; n: number };
  const ttfcBySetter: Record<string, TtfcAgg> = {};
  const isSetter = (userId: string) => setterIds.has(userId);

  for (const leadId of leadsWithRequest) {
    const requestAt = firstReqByLead.get(leadId);
    const attemptEventAt = firstAttemptEventByLead.get(leadId);
    if (!requestAt || !attemptEventAt) continue;

    const endWindow = new Date(attemptEventAt.getTime() + 5 * 60 * 1000);
    const ca = await this.prisma.callAttempt.findFirst({
      where: {
        leadId,
        startedAt: { gte: requestAt, lte: endWindow },
      },
      orderBy: { startedAt: 'asc' },
      select: { userId: true, startedAt: true },
    });

    let ownerSetterId: string | null = null;
    if (ca?.userId && isSetter(ca.userId)) ownerSetterId = ca.userId;
    if (!ownerSetterId) {
      const l = await this.prisma.lead.findUnique({
        where: { id: leadId },
        select: { setterId: true },
      });
      if (l?.setterId && isSetter(l.setterId)) ownerSetterId = l.setterId;
    }
    if (!ownerSetterId) continue;

    const diffMin = Math.round((attemptEventAt.getTime() - requestAt.getTime()) / 60000);
    if (diffMin < 0) continue;

    const a = ttfcBySetter[ownerSetterId] || { sum: 0, n: 0 };
    a.sum += diffMin;
    a.n += 1;
    ttfcBySetter[ownerSetterId] = a;
  }

  // 4) Construction des lignes
  const rows: SetterRow[] = [];
  for (const s of setters) {
    const leads = allLeads.filter((l) => l.setterId === s.id);
    const leadIds = leads.map((l) => l.id);
    const leadsReceived = leadIds.length;

    const rv0Count = await this.prisma.appointment.count({
      where: { userId: s.id, type: AppointmentType.RV0, ...between('scheduledAt', r) },
    });

    // ⬇️ IMPORTANT : basé sur StageEvent RV1_HONORED
    const rv1Set = rv1FromHisLeadsBySetter.get(s.id);
    const rv1FromHisLeads = rv1Set ? rv1Set.size : 0;

    const ttfcAgg = ttfcBySetter[s.id];
    const ttfcAvgMinutes = ttfcAgg?.n ? Math.round(ttfcAgg.sum / ttfcAgg.n) : null;

    // Revenus (WON) sur ses leads
    const wonWhere: any = await this.wonFilter(r);
    wonWhere.setterId = s.id;
    const wonAgg = await this.prisma.lead.aggregate({
      _sum: { saleValue: true },
      where: wonWhere,
    });
    const revenueFromHisLeads = num(wonAgg._sum?.saleValue ?? 0);

    // Répartition des budgets + dérivées coût
    const spendShare =
      totalLeads && leadsReceived
        ? spend * (leadsReceived / totalLeads)
        : leadsReceived
        ? spend
        : 0;
    const cpl = leadsReceived ? Number((spendShare / leadsReceived).toFixed(2)) : null;
    const cpRv0 = rv0Count ? Number((spendShare / rv0Count).toFixed(2)) : null;
    const cpRv1 = rv1FromHisLeads ? Number((spendShare / rv1FromHisLeads).toFixed(2)) : null;
    const roas = spendShare
      ? Number((revenueFromHisLeads / spendShare).toFixed(2))
      : revenueFromHisLeads
      ? Infinity
      : null;

    rows.push({
      userId: s.id,
      name: s.firstName,
      email: s.email,
      leadsReceived: num(leadsReceived),
      rv0Count: num(rv0Count),
      rv1FromHisLeads: num(rv1FromHisLeads),
      ttfcAvgMinutes,
      revenueFromHisLeads,
      spendShare: Number(spendShare.toFixed(2)),
      cpl,
      cpRv0,
      cpRv1,
      roas,
    });
  }

  return rows;
}


/* ---------------- Closers (RV1_HONORED via StageEvent) ---------------- */
async closersReport(from?: string, to?: string): Promise<CloserRow[]> {
  const r = toRange(from, to);
  const closers = await this.prisma.user.findMany({
    where: { role: Role.CLOSER, isActive: true },
    select: { id: true, firstName: true, email: true },
    orderBy: { firstName: 'asc' },
  });
  const spend = await this.sumSpend(r);

  /* ========= RV1_HONORED par closer basé sur StageEvent =========
     - StageEvent.toStage = RV1_HONORED
     - occurredAt dans [from;to]
     - On crédite le closer du lead (lead.closerId)
  ========================================================================= */
  const rv1Events = await this.prisma.stageEvent.findMany({
    where: {
      toStage: LeadStage.RV1_HONORED,
      ...between('occurredAt', r),
    },
    select: {
      leadId: true,
      lead: {
        select: { closerId: true },
      },
    },
  });

  const rv1HonoredByCloser = new Map<string, Set<string>>(); // closerId -> Set<leadId>
  for (const ev of rv1Events) {
    if (!ev.lead || !ev.lead.closerId || !ev.leadId) continue;
    const cId = ev.lead.closerId;
    if (!rv1HonoredByCloser.has(cId)) {
      rv1HonoredByCloser.set(cId, new Set());
    }
    rv1HonoredByCloser.get(cId)!.add(ev.leadId);
  }

  const rows: CloserRow[] = [];
  for (const c of closers) {
    const rv1Planned = await this.prisma.appointment.count({
      where: { userId: c.id, type: AppointmentType.RV1, ...between('scheduledAt', r) },
    });

    // ⬇️ IMPORTANT : basé sur StageEvent RV1_HONORED
    const rv1Set = rv1HonoredByCloser.get(c.id);
    const rv1Honored = rv1Set ? rv1Set.size : 0;

    const rv1NoShow = await this.prisma.appointment.count({
      where: {
        userId: c.id,
        type: AppointmentType.RV1,
        status: AppointmentStatus.NO_SHOW,
        ...between('scheduledAt', r),
      },
    });
    const rv2Planned = await this.prisma.appointment.count({
      where: { userId: c.id, type: AppointmentType.RV2, ...between('scheduledAt', r) },
    });
    const rv2Honored = await this.prisma.appointment.count({
      where: {
        userId: c.id,
        type: AppointmentType.RV2,
        status: AppointmentStatus.HONORED,
        ...between('scheduledAt', r),
      },
    });

    const wonWhere: any = await this.wonFilter(r);
    wonWhere.closerId = c.id;
    const wonAgg = await this.prisma.lead.aggregate({
      _sum: { saleValue: true },
      where: wonWhere,
    });
    const revenueTotal = num(wonAgg._sum?.saleValue ?? 0);
    const salesClosed = await this.prisma.lead.count({ where: wonWhere });

    const roasPlanned = rv1Planned
      ? Number(((revenueTotal || 0) / (spend || 1) / rv1Planned).toFixed(2))
      : null;
    const roasHonored = rv1Honored
      ? Number(((revenueTotal || 0) / (spend || 1) / rv1Honored).toFixed(2))
      : null;

    rows.push({
      userId: c.id,
      name: c.firstName,
      email: c.email,
      rv1Planned: num(rv1Planned),
      rv1Honored: num(rv1Honored),
      rv1NoShow: num(rv1NoShow),
      rv2Planned: num(rv2Planned),
      rv2Honored: num(rv2Honored),
      salesClosed: num(salesClosed),
      revenueTotal,
      roasPlanned,
      roasHonored,
    });
  }
  return rows;
}


  /* ---------------- Équipe de choc (duos setter × closer) ---------------- */
  async duosReport(from?: string, to?: string): Promise<DuoRow[]> {
    const r = toRange(from, to);
    const where = await this.wonFilter(r);
    // on ne garde que les leads avec setter + closer
    (where as any).setterId = { not: null };
    (where as any).closerId = { not: null };

    const leads = await this.prisma.lead.findMany({
      where,
      select: {
        id: true,
        saleValue: true,
        setterId: true,
        closerId: true,
        setter: { select: { id: true, firstName: true, email: true } },
        closer: { select: { id: true, firstName: true, email: true } },
      },
    });

    type DuoAgg = {
      setterId: string;
      setterName: string;
      setterEmail: string;
      closerId: string;
      closerName: string;
      closerEmail: string;
      leadIds: string[];
      salesCount: number;
      revenue: number;
      rv1Planned: number;
      rv1Honored: number;
    };

    const map = new Map<string, DuoAgg>();

    for (const L of leads) {
      if (!L.setterId || !L.closerId || !L.setter || !L.closer) continue;
      const key = `${L.setterId}::${L.closerId}`;
      const row =
        map.get(key) ??
        {
          setterId: L.setterId,
          setterName: L.setter.firstName,
          setterEmail: L.setter.email,
          closerId: L.closerId,
          closerName: L.closer.firstName,
          closerEmail: L.closer.email,
          leadIds: [],
          salesCount: 0,
          revenue: 0,
          rv1Planned: 0,
          rv1Honored: 0,
        };

      row.leadIds.push(L.id);
      row.salesCount += 1;
      row.revenue += num(L.saleValue ?? 0);

      map.set(key, row);
    }

    // Compléter avec les RV1 pour chaque duo
    for (const duo of map.values()) {
      if (!duo.leadIds.length) continue;

      const rv1Planned = await this.prisma.appointment.count({
        where: {
          type: AppointmentType.RV1,
          leadId: { in: duo.leadIds },
        },
      });

      const rv1Honored = await this.prisma.appointment.count({
        where: {
          type: AppointmentType.RV1,
          leadId: { in: duo.leadIds },
          status: AppointmentStatus.HONORED,
        },
      });

      duo.rv1Planned = num(rv1Planned);
      duo.rv1Honored = num(rv1Honored);
    }

    const out: DuoRow[] = Array.from(map.values()).map((d) => ({
      setterId: d.setterId,
      setterName: d.setterName,
      setterEmail: d.setterEmail,
      closerId: d.closerId,
      closerName: d.closerName,
      closerEmail: d.closerEmail,
      salesCount: d.salesCount,
      revenue: d.revenue,
      avgDeal: d.salesCount ? Math.round(d.revenue / d.salesCount) : 0,
      rv1Planned: d.rv1Planned,
      rv1Honored: d.rv1Honored,
      rv1HonorRate: d.rv1Planned ? Math.round((d.rv1Honored / d.rv1Planned) * 100) : null,
    }));

    // Tri : plus gros CA en premier
    return out.sort((a, b) => b.revenue - a.revenue);
  }

  /* ---------------- Résumé ---------------- */
  async summary(from?: string, to?: string): Promise<SummaryOut> {
    const r = toRange(from, to);
    const [leads, wonAgg, setters, closers] = await Promise.all([
      this.leadsReceived(from, to),
      (async () => {
        const where = await this.wonFilter(r);
        const agg = await this.prisma.lead.aggregate({
          _sum: { saleValue: true },
          _count: { _all: true },
          where,
        });
        return { revenue: num(agg._sum.saleValue ?? 0), count: num(agg._count._all ?? 0) };
      })(),
      this.settersReport(from, to),
      this.closersReport(from, to),
    ]);

    const spend = await this.sumSpend(r);

    return {
      period: { from, to },
      totals: {
        leads: num(leads.total),
        revenue: wonAgg.revenue,
        salesCount: wonAgg.count,
        spend: num(spend),
        roas: spend ? Number((wonAgg.revenue / spend).toFixed(2)) : null,
        settersCount: (setters as any).length,
        closersCount: (closers as any).length,
        rv1Honored: (closers as any).reduce((s: number, r0: any) => s + num(r0.rv1Honored || 0), 0),
      },
    };
  }

  /* ========================================================================
     ======================  NOUVEAU : STAGE-ONLY  ==========================
     ======================================================================*/

  /** Récupère les IDs de Stage dynamiques pour une liste de slugs (= clés Pipeline). */
  private async stageIdsForKeys(keys: string[]): Promise<string[]> {
    if (!keys?.length) return [];
    const rows = await this.prisma.stage.findMany({
      where: { slug: { in: keys }, isActive: true },
      select: { id: true },
    });
    return rows.map(r => r.id);
  }

  /** Compte les leads qui ont ENTRÉ dans l’un des stages `keys` pendant [from;to] (via stageUpdatedAt). */
  private async countEnteredInStages(keys: string[], r: Range): Promise<number> {
    if (!keys?.length) return 0;
    const ids = await this.stageIdsForKeys(keys);
    const where: any = {
      AND: [
        { OR: [{ stage: { in: keys as any } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
        between('stageUpdatedAt', r),
      ],
    };
    return num(await this.prisma.lead.count({ where }));
  }

  /** Compte les leads ACTUELLEMENT dans l’un des stages `keys` (peu importe stageUpdatedAt). */
  private async countCurrentInStages(keys: string[]): Promise<number> {
    if (!keys?.length) return 0;
    const ids = await this.stageIdsForKeys(keys);
    const where: any = { OR: [{ stage: { in: keys as any } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] };
    return num(await this.prisma.lead.count({ where }));
  }

  /* ----------- Batch métriques pipeline pour le front (funnel cartes) ----------- */
  async pipelineMetrics(args: {
    keys: string[];
    from?: string;
    to?: string;
    mode?: 'entered' | 'current';
  }): Promise<Record<string, number>> {
    const { keys, from, to, mode = 'entered' } = args;
    const r = toRange(from, to);
    const unique = Array.from(new Set(keys));

    const out: Record<string, number> = {};
    await Promise.all(
      unique.map(async (k) => {
        out[k] =
          mode === 'current'
            ? await this.countCurrentInStages([k])
            : await this.countEnteredInStages([k], r);
      }),
    );
    return out;
  }

  /* ---------------- Funnel (TOUT via stages, comme Leads/WON) ---------------- */
  private async funnelFromStages(r: Range): Promise<FunnelTotals> {
    const get = (keys: string[]) => this.countEnteredInStages(keys, r);

    const [
      leadsCreated,
      callReq,
      calls,
      answered,
      setterNoShow,
      rv0P, rv0H, rv0NS,
      rv1P, rv1H, rv1NS,
      rv2P, rv2H,
      notQual, lost,
      wonCount,
    ] = await Promise.all([
      this.prisma.lead.count({ where: between('createdAt', r) }),

      get(['CALL_REQUESTED']),
      get(['CALL_ATTEMPT']),
      get(['CALL_ANSWERED']),
      get(['SETTER_NO_SHOW']),
      get(['RV0_PLANNED']), get(['RV0_HONORED']), get(['RV0_NO_SHOW']),
      get(['RV1_PLANNED']), get(['RV1_HONORED']), get(['RV1_NO_SHOW']),
      get(['RV2_PLANNED']), get(['RV2_HONORED']),
      get(['NOT_QUALIFIED']), get(['LOST']),
      (async () => (await this.wonFilter(r), await this.countEnteredInStages(['WON'], r)))(),
    ]);

    return {
      leads: num(leadsCreated),
      callRequests: num(callReq),
      callsTotal: num(calls),
      callsAnswered: num(answered),
      setterNoShow: num(setterNoShow),
      rv0Planned: num(rv0P),
      rv0Honored: num(rv0H),
      rv0NoShow: num(rv0NS),
      rv1Planned: num(rv1P),
      rv1Honored: num(rv1H),
      rv1NoShow: num(rv1NS),
      rv2Planned: num(rv2P),
      rv2Honored: num(rv2H),
      notQualified: num(notQual),
      lost: num(lost),
      wonCount: num(wonCount),
    };
  }

  async funnel(from?: string, to?: string): Promise<FunnelOut> {
    const r = toRange(from, to);
    const totals = await this.funnelFromStages(r);

    const start = mondayOfUTC(r.from ?? new Date());
    const end = sundayOfUTC(r.to ?? new Date());

    const weekly: FunnelWeeklyRow[] = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
      const ws = mondayOfUTC(d);
      const we = sundayOfUTC(d);
      const clip = intersectWindow(ws, we, r.from, r.to);
      const wRange: Range = { from: clip?.start, to: clip?.end };
      const wTotals = await this.funnelFromStages(wRange);
      weekly.push({ weekStart: ws.toISOString(), weekEnd: we.toISOString(), ...wTotals });
    }

    return { period: { from, to }, totals, weekly };
  }

  /* ---------------- Weekly series (pour /reporting/weekly-ops) ---------------- */
  async weeklySeries(from?: string, to?: string): Promise<WeeklyOpsRow[]> {
    const r = toRange(from, to);
    const start = mondayOfUTC(r.from ?? new Date());
    const end = sundayOfUTC(r.to ?? new Date());
    const out: WeeklyOpsRow[] = [];

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
      const ws = mondayOfUTC(d);
      const we = sundayOfUTC(d);
      const clip = intersectWindow(ws, we, r.from, r.to);
      const wRange: Range = { from: clip?.start, to: clip?.end };

      const row: WeeklyOpsRow = {
        weekStart: ws.toISOString(),
        weekEnd: we.toISOString(),
        rv0Planned: await this.countEnteredInStages(['RV0_PLANNED'], wRange),
        rv0Honored: await this.countEnteredInStages(['RV0_HONORED'], wRange),
        rv0NoShow: await this.countEnteredInStages(['RV0_NO_SHOW'], wRange),
        rv1Planned: await this.countEnteredInStages(['RV1_PLANNED'], wRange),
        rv1Honored: await this.countEnteredInStages(['RV1_HONORED'], wRange),
        rv1NoShow: await this.countEnteredInStages(['RV1_NO_SHOW'], wRange),
        rv2Planned: await this.countEnteredInStages(['RV2_PLANNED'], wRange),
        rv2Honored: await this.countEnteredInStages(['RV2_HONORED'], wRange),
        rv2Postponed: await this.countEnteredInStages(['RV2_POSTPONED'], wRange),
        notQualified: await this.countEnteredInStages(['NOT_QUALIFIED'], wRange),
        lost: await this.countEnteredInStages(['LOST'], wRange),
      };
      out.push(row);
    }
    return out;
  }

    /* =================== METRICS JOURNALIÈRES BASÉES SUR LES STAGES =================== */

  /** Compte par jour le nombre de leads qui sont ENTRÉS dans l’un des stages `keys` (via stageUpdatedAt). */
  private async perDayFromStages(
    keys: string[],
    from?: string,
    to?: string,
  ): Promise<{ total: number; byDay?: Array<{ day: string; count: number }> }> {
    const r = toRange(from, to);
    const ids = await this.stageIdsForKeys(keys);

    if (!r.from || !r.to) {
      const where: any = {
        AND: [
          { OR: [{ stage: { in: keys as any } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
        ],
      };
      const total = await this.prisma.lead.count({ where });
      return { total: num(total), byDay: [] };
    }

    const days: Array<{ day: string; count: number }> = [];
    let total = 0;
    const start = new Date(r.from);
    const end = new Date(r.to);

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const d0 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      const d1 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

      const where: any = {
        AND: [
          { OR: [{ stage: { in: keys as any } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
          { stageUpdatedAt: { gte: d0, lte: d1 } },
        ],
      };

      const n = await this.prisma.lead.count({ where });
      total += num(n);
      days.push({ day: d0.toISOString(), count: num(n) });
    }

    return { total, byDay: days };
  }

  /** Demandes d’appel par jour — basées sur l’entrée en stage CALL_REQUESTED */
  async metricCallRequests(from?: string, to?: string) {
    return this.perDayFromStages(['CALL_REQUESTED'], from, to);
  }

  /** Appels passés par jour — basés sur l’entrée en stage CALL_ATTEMPT */
  async metricCalls(from?: string, to?: string) {
    return this.perDayFromStages(['CALL_ATTEMPT'], from, to);
  }

  /** Appels répondus par jour — basés sur l’entrée en stage CALL_ANSWERED */
  async metricCallsAnswered(from?: string, to?: string) {
    return this.perDayFromStages(['CALL_ANSWERED'], from, to);
  }


  /* ---------------- DRILLS ---------------- */

  async drillLeadsReceived(args: { from?: string; to?: string; limit: number }) {
    const r = toRange(args.from, args.to);
    const rows = await this.prisma.lead.findMany({
      where: between('createdAt', r),
      orderBy: { createdAt: 'desc' },
      take: args.limit,
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true,
        setter: { select: { id: true, firstName: true, email: true } },
        closer: { select: { id: true, firstName: true, email: true } },
        saleValue: true,
      },
    });
    const items = rows.map((L) => ({
      leadId: L.id,
      leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
      email: L.email, phone: L.phone,
      setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
      closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
      appointment: null,
      saleValue: L.saleValue ?? null,
      createdAt: L.createdAt.toISOString(),
    }));
    return { ok: true, count: items.length, items };
  }

  async drillWon(args: { from?: string; to?: string; limit: number }) {
    const r = toRange(args.from, args.to);
    const where = await this.wonFilter(r);
    const rows = await this.prisma.lead.findMany({
      where,
      orderBy: { stageUpdatedAt: 'desc' },
      take: args.limit,
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        setter: { select: { id: true, firstName: true, email: true } },
        closer: { select: { id: true, firstName: true, email: true } },
        saleValue: true, createdAt: true, stageUpdatedAt: true,
      },
    });
    const items = rows.map((L) => ({
      leadId: L.id,
      leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
      email: L.email, phone: L.phone,
      setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
      closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
      appointment: null,
      saleValue: L.saleValue ?? null,
      createdAt: L.createdAt.toISOString(),
      stageUpdatedAt: L.stageUpdatedAt.toISOString(),
    }));
    return { ok: true, count: items.length, items };
  }

  async drillAppointments(args: {
    from?: string;
    to?: string;
    type?: 'RV0' | 'RV1' | 'RV2';
    status?: 'HONORED' | 'POSTPONED' | 'CANCELED' | 'NO_SHOW' | 'NOT_QUALIFIED';
    userId?: string;
    limit: number;
  }) {
    const r = toRange(args.from, args.to);
    const where: any = {
      ...between('scheduledAt', r),
      ...(args.type ? { type: args.type } : {}),
      ...(args.status ? { status: args.status } : {}),
      ...(args.userId ? { userId: args.userId } : {}),
    };
    const rows = await this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: args.limit,
      select: {
        type: true, status: true, scheduledAt: true, userId: true,
        lead: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true, createdAt: true, stageUpdatedAt: true,
          },
        },
      },
    });
    const items = rows
      .filter((r0) => !!r0.lead)
      .map((r0) => {
        const L = r0.lead!;
        return {
          leadId: L.id,
          leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
          email: L.email, phone: L.phone,
          setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
          closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
          appointment: { type: r0.type, status: r0.status, scheduledAt: r0.scheduledAt.toISOString() },
          saleValue: L.saleValue ?? null,
          createdAt: L.createdAt.toISOString(),
          stageUpdatedAt: L.stageUpdatedAt.toISOString(),
        };
      });
    return { ok: true, count: items.length, items };
  }

  async drillCallRequests(args: { from?: string; to?: string; limit: number }) {
    const r = toRange(args.from, args.to);
    const rows = await this.prisma.callRequest.findMany({
      where: between('requestedAt', r),
      orderBy: { requestedAt: 'desc' },
      take: args.limit,
      select: {
        requestedAt: true, channel: true, status: true,
        lead: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true, createdAt: true, stageUpdatedAt: true,
          },
        },
      },
    });
    const items = rows
      .filter((r0) => !!r0.lead)
      .map((r0) => {
        const L = r0.lead!;
        return {
          leadId: L.id,
          leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
          email: L.email, phone: L.phone,
          setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
          closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
          appointment: { type: 'CALL_REQUEST', status: r0.status as any, scheduledAt: r0.requestedAt.toISOString() },
          saleValue: L.saleValue ?? null,
          createdAt: L.createdAt.toISOString(),
          stageUpdatedAt: L.stageUpdatedAt.toISOString(),
        };
      });
    return { ok: true, count: items.length, items };
  }

  async drillCalls(args: {
    from?: string;
    to?: string;
    answered?: boolean;
    setterNoShow?: boolean;
    limit: number;
  }) {
    if (args.answered) {
      const r = toRange(args.from, args.to);
      const rows = await this.prisma.callAttempt.findMany({
        where: { outcome: CallOutcome.ANSWERED, ...between('startedAt', r) },
        orderBy: { startedAt: 'desc' },
        take: args.limit,
        select: {
          startedAt: true, outcome: true, userId: true,
          lead: {
            select: {
              id: true, firstName: true, lastName: true, email: true, phone: true,
              setter: { select: { id: true, firstName: true, email: true } },
              closer: { select: { id: true, firstName: true, email: true } },
              saleValue: true, createdAt: true, stageUpdatedAt: true,
            },
          },
        },
      });
      const items = rows
        .filter((r0) => !!r0.lead)
        .map((r0) => {
          const L = r0.lead!;
          return {
            leadId: L.id,
            leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
            email: L.email, phone: L.phone,
            setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
            closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
            appointment: { type: 'CALL', status: r0.outcome as any, scheduledAt: r0.startedAt.toISOString() },
            saleValue: L.saleValue ?? null,
            createdAt: L.createdAt.toISOString(),
            stageUpdatedAt: L.stageUpdatedAt.toISOString(),
          };
        });
      return { ok: true, count: items.length, items };
    }

    if (args.setterNoShow) {
      const r = toRange(args.from, args.to);
      const rows = await this.prisma.lead.findMany({
        where: { stage: LeadStage.SETTER_NO_SHOW, ...between('stageUpdatedAt', r) },
        orderBy: { stageUpdatedAt: 'desc' },
        take: args.limit,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          setter: { select: { id: true, firstName: true, email: true } },
          closer: { select: { id: true, firstName: true, email: true } },
          saleValue: true, createdAt: true, stageUpdatedAt: true,
        },
      });
      const items = rows.map((L) => ({
        leadId: L.id,
        leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
        email: L.email, phone: L.phone,
        setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
        closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
        appointment: null,
        saleValue: L.saleValue ?? null,
        createdAt: L.createdAt.toISOString(),
        stageUpdatedAt: L.stageUpdatedAt.toISOString(),
      }));
      return { ok: true, count: items.length, items };
    }

    const r = toRange(args.from, args.to);
    const rows = await this.prisma.callAttempt.findMany({
      where: between('startedAt', r),
      orderBy: { startedAt: 'desc' },
      take: args.limit,
      select: {
        startedAt: true, outcome: true, userId: true,
        lead: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true, createdAt: true, stageUpdatedAt: true,
          },
        },
      },
    });
    const items = rows
      .filter((r0) => !!r0.lead)
      .map((r0) => {
        const L = r0.lead!;
        return {
          leadId: L.id,
          leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
          email: L.email, phone: L.phone,
          setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
          closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
          appointment: { type: 'CALL', status: r0.outcome as any, scheduledAt: r0.startedAt.toISOString() },
          saleValue: L.saleValue ?? null,
          createdAt: L.createdAt.toISOString(),
          stageUpdatedAt: L.stageUpdatedAt.toISOString(),
        };
      });
    
    return { ok: true, count: items.length, items };
  }
}
