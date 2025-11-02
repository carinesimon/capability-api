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

/* =========================================================================
   =============== HELPERS GÉNÉRIQUES (dates, nombres) =====================
   ========================================================================= */
type Range = { from?: Date; to?: Date };
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

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

/* =========================================================================
   ================== TYPES SORTIE ALIGNÉS AU FRONT ========================
   ========================================================================= */
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

/* =========================================================================
   ================== ALIAS STAGES (FR/EN) =================================
   ========================================================================= */
/**
 * Ici on mappe ce que ton board envoie (FR) vers un canonique (EN)
 * qu’on utilise partout dans le reporting.
 *
 * ⚠️ très important : ça doit refléter EXACTEMENT ce que tu mets dans
 * `LeadStageHistory.stage` côté service de déplacement.
 */
const HISTORY_ALIASES: Record<string, string[]> = {
  LEADS_RECEIVED: [
    'LEADS_RECEIVED',
    'LEAD_RECU',
    'LEAD_REÇU',
    'LEADS_RECU',
    'CONTACT_CREE',
    'CONTACT_CRÉÉ',
    'CONTACTS_CREES',
    'CONTACTS_CRÉÉS',
  ],
  CALL_REQUESTED: ['CALL_REQUESTED', 'DEMANDE_APPEL', 'INTENT_RDV', 'REQUESTED_CALL'],
  CALL_ATTEMPT: ['CALL_ATTEMPT', 'APPEL_PASSE', 'CALL_MADE', 'CALLS', 'APPELS'],
  CALL_ANSWERED: ['CALL_ANSWERED', 'APPEL_REPONDU', 'APPEL_RÉPONDU', 'ANSWERED', 'CONTACTED'],
  SETTER_NO_SHOW: ['SETTER_NO_SHOW', 'NO_SHOW_SETTER'],
  FOLLOW_UP: ['FOLLOW_UP', 'RELANCE'],
  RV0_PLANNED: ['RV0_PLANNED', 'RV0_PLANIFIE', 'RV0_PLANIFIÉ', 'RDV0_PLANIFIE'],
  RV0_HONORED: ['RV0_HONORED', 'RV0_HONORE', 'RV0_HONORÉ', 'RDV0_HONORE'],
  RV0_NO_SHOW: ['RV0_NO_SHOW', 'NO_SHOW_RV0', 'RDV0_NO_SHOW'],
  RV1_PLANNED: ['RV1_PLANNED', 'RV1_PLANIFIE', 'RV1_PLANIFIÉ', 'RDV1_PLANIFIE'],
  RV1_HONORED: ['RV1_HONORED', 'RV1_HONORE', 'RV1_HONORÉ', 'RDV1_HONORE'],
  RV1_NO_SHOW: ['RV1_NO_SHOW', 'NO_SHOW_RV1', 'RDV1_NO_SHOW'],
  RV2_PLANNED: ['RV2_PLANNED', 'RV2_PLANIFIE', 'RV2_PLANIFIÉ', 'RDV2_PLANIFIE'],
  RV2_HONORED: ['RV2_HONORED', 'RV2_HONORE', 'RV2_HONORÉ', 'RDV2_HONORE'],
  NOT_QUALIFIED: ['NOT_QUALIFIED', 'NON_QUALIFIE', 'NON_QUALIFIÉ', 'NQ'],
  LOST: ['LOST', 'PERDU', 'CLOSED_LOST'],
  WON: ['WON', 'CLOSED_WON'],
};

function normalizeToken(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  /* =========================================================================
     =========================== WON (leads) =================================
     ========================================================================= */
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

  /* =========================================================================
     ============================== BUDGETS ===================================
     ========================================================================= */
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

  /* =========================================================================
     ======================== LEADS REÇUS (création) ==========================
     ========================================================================= */
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

  /* =========================================================================
     ============ HELPERS SPÉCIFIQUES LeadStageHistory =======================
     ========================================================================= */

  /** Retourne toutes les variantes possibles d’un canonique (FR/EN) */
  private variantsFor(canonical: string): string[] {
    const base = canonical.toUpperCase();
    const aliases = HISTORY_ALIASES[base] || [];
    // on garde aussi la version normalisée pour être large
    const more = aliases.map(normalizeToken);
    return Array.from(new Set([base, ...aliases, ...more]));
  }

  /** Construit un where pour LeadStageHistory à partir d’un canonique */
  private historyWhere(canonical: string, r?: Range) {
    const stages = this.variantsFor(canonical);
    const where: any = { stage: { in: stages } };
    if (r && (r.from || r.to)) {
      where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
    }
    return where;
  }

  /** Compte les entrées dans un stage (irréversible) */
  private async countHistory(canonical: string, r?: Range): Promise<number> {
    const where = this.historyWhere(canonical, r);
    return await (this.prisma as any).leadStageHistory.count({ where });
  }

  /** Compte par jour les entrées dans un stage (pour les charts) */
  private async perDayFromHistory(
    canonical: string,
    from?: string,
    to?: string,
  ): Promise<{ total: number; byDay?: Array<{ day: string; count: number }> }> {
    const r = toRange(from, to);
    if (!r.from || !r.to) {
      const total = await this.countHistory(canonical, r);
      return { total, byDay: [] };
    }

    const days: Array<{ day: string; count: number }> = [];
    let total = 0;
    const start = new Date(r.from);
    const end = new Date(r.to);

    const stages = this.variantsFor(canonical);

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const d0 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      const d1 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getDate(), 23, 59, 59, 999));

      const n = await (this.prisma as any).leadStageHistory.count({
        where: {
          stage: { in: stages },
          occurredAt: { gte: d0, lte: d1 },
        },
      });
      total += num(n);
      days.push({ day: d0.toISOString(), count: num(n) });
    }

    return { total, byDay: days };
  }

  /** Compte pour plusieurs stages d’un coup (utilisé par weekly ops) */
  private async countHistoryMany(canonicals: string[], r: Range): Promise<number> {
    const variants = canonicals.flatMap((c) => this.variantsFor(c));
    const where: any = { stage: { in: variants } };
    if (r.from || r.to) {
      where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
    }
    return await (this.prisma as any).leadStageHistory.count({ where });
  }

  /* =========================================================================
     ======================== VENTES (WON) HEBDO ==============================
     ========================================================================= */
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

  /* =========================================================================
     ======================== SETTERS REPORT =================================
     ========================================================================= */
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

    // Leads créés dans la période
    const allLeads = await this.prisma.lead.findMany({
      where: between('createdAt', r),
      select: { id: true, setterId: true, createdAt: true },
    });
    const totalLeads = allLeads.length;

    /* ===== RV0 planifiés par setter (via leadEvent) ===== */
    const rv0PlannedEvents = await (this.prisma as any).leadEvent.findMany({
      where: { type: 'RV0_PLANNED', ...between('occurredAt', r) },
      select: { leadId: true },
    });

    const rv0LeadIds = rv0PlannedEvents.map((e: any) => e.leadId).filter(Boolean);
    const rv0Leads = rv0LeadIds.length
      ? await this.prisma.lead.findMany({
          where: { id: { in: rv0LeadIds } },
          select: { id: true, setterId: true },
        })
      : [];
    const setterByLead = new Map(rv0Leads.map((l) => [l.id, l.setterId || 'UNASSIGNED']));
    const rv0PlannedBySetter = new Map<string, number>();
    for (const e of rv0PlannedEvents) {
      const sid = setterByLead.get(e.leadId) || 'UNASSIGNED';
      rv0PlannedBySetter.set(sid, (rv0PlannedBySetter.get(sid) || 0) + 1);
    }

    /* ===== RV1 HONORED par setter (via leadEvent) ===== */
    const rv1HonoredBySetter = new Map<string, number>();
    {
      const evs = await (this.prisma as any).leadEvent.findMany({
        where: { type: 'RV1_HONORED', ...between('occurredAt', r) },
        select: { lead: { select: { setterId: true } } },
      });
      for (const ev of evs) {
        const sid = ev.lead?.setterId || 'UNASSIGNED';
        rv1HonoredBySetter.set(sid, (rv1HonoredBySetter.get(sid) || 0) + 1);
      }
    }

    /* ====== TTFC (CALL_REQUESTED -> CALL_ATTEMPT) ====== */
    const reqEvents = await (this.prisma as any).leadEvent.findMany({
      where: { type: 'CALL_REQUESTED', ...between('occurredAt', r) },
      orderBy: { occurredAt: 'asc' },
      select: { leadId: true, occurredAt: true },
    });
    const firstReqByLead = new Map<string, Date>();
    for (const ev of reqEvents) {
      if (ev.leadId && !firstReqByLead.has(ev.leadId)) firstReqByLead.set(ev.leadId, ev.occurredAt as any);
    }
    const leadsWithRequest = Array.from(firstReqByLead.keys());

    const attemptEvents = leadsWithRequest.length
      ? await (this.prisma as any).leadEvent.findMany({
          where: { type: 'CALL_ATTEMPT', leadId: { in: leadsWithRequest } },
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
      if (!firstAttemptEventByLead.has(ev.leadId)) firstAttemptEventByLead.set(ev.leadId, ev.occurredAt as any);
    }

    type TtfcAgg = { sum: number; n: number };
    const ttfcBySetter: Record<string, TtfcAgg> = {};
    const isSetter = (userId: string) => setterIds.has(userId);

    for (const leadId of leadsWithRequest) {
      const requestAt = firstReqByLead.get(leadId);
      const attemptEventAt = firstAttemptEventByLead.get(leadId);
      if (!requestAt || !attemptEventAt) continue;

      const endWindow = new Date(attemptEventAt.getTime() + 5 * 60 * 1000);
      const ca = await this.prisma.callAttempt.findFirst({
        where: { leadId, startedAt: { gte: requestAt, lte: endWindow } },
        orderBy: { startedAt: 'asc' },
        select: { userId: true, startedAt: true },
      });

      let ownerSetterId: string | null = null;
      if (ca?.userId && isSetter(ca.userId)) ownerSetterId = ca.userId;
      if (!ownerSetterId) {
        const l = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { setterId: true } });
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

    /* ===================== Lignes ===================== */
    const rows: SetterRow[] = [];
    for (const s of setters) {
      const leads = allLeads.filter((l) => l.setterId === s.id);
      const leadIds = leads.map((l) => l.id);
      const leadsReceived = leadIds.length;

      const rv0Count = rv0PlannedBySetter.get(s.id) || 0;
      const rv1FromHisLeads = rv1HonoredBySetter.get(s.id) || 0;

      const ttfcAgg = ttfcBySetter[s.id];
      const ttfcAvgMinutes = ttfcAgg?.n ? Math.round(ttfcAgg.sum / ttfcAgg.n) : null;

      const wonWhere: any = await this.wonFilter(r);
      wonWhere.setterId = s.id;
      const wonAgg = await this.prisma.lead.aggregate({
        _sum: { saleValue: true },
        _count: { _all: true },
        where: wonWhere,
      });
      const revenueFromHisLeads = num(wonAgg._sum?.saleValue ?? 0);
      const salesFromHisLeads = num(wonAgg._count?._all ?? 0);

      const spendShare =
        totalLeads && leadsReceived ? spend * (leadsReceived / totalLeads) : leadsReceived ? spend : 0;

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
        // champ consommé côté front
        salesFromHisLeads,
      } as any);
    }

    return rows;
  }

  /* =========================================================================
     ======================= DUOS SETTER × CLOSER =============================
     ========================================================================= */
  async duosReport(from?: string, to?: string, top = 10): Promise<DuoRow[]> {
    const r = toRange(from, to);

    const baseWon = await this.wonFilter(r);
    const whereWon: any = {
      ...baseWon,
      setterId: { not: null },
      closerId: { not: null },
    };

    const groups = await this.prisma.lead.groupBy({
      by: ['setterId', 'closerId'],
      where: whereWon,
      _sum: { saleValue: true },
      _count: { _all: true },
      orderBy: { _sum: { saleValue: 'desc' } },
    });

    if (!groups.length) return [];

    const userIds = Array.from(new Set(groups.flatMap((g) => [g.setterId!, g.closerId!])));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, email: true },
    });
    const uById = new Map(users.map((u) => [u.id, u]));

    const rows: DuoRow[] = [];
    for (const g of groups) {
      const setter = uById.get(g.setterId!) || { firstName: '—', email: '—' };
      const closer = uById.get(g.closerId!) || { firstName: '—', email: '—' };

      const wonLeads = await this.prisma.lead.findMany({
        where: {
          ...whereWon,
          setterId: g.setterId!,
          closerId: g.closerId!,
        },
        select: { id: true },
      });
      const wonLeadIds = wonLeads.map((l) => l.id);

      let rv1Planned = 0;
      let rv1Honored = 0;
      if (wonLeadIds.length) {
        rv1Planned = await this.prisma.appointment.count({
          where: {
            type: AppointmentType.RV1,
            leadId: { in: wonLeadIds },
            ...between('scheduledAt', toRange(from, to)),
          },
        });
        rv1Honored = await this.prisma.appointment.count({
          where: {
            type: AppointmentType.RV1,
            status: AppointmentStatus.HONORED,
            leadId: { in: wonLeadIds },
            ...between('scheduledAt', toRange(from, to)),
          },
        });
      }

      const salesCount = g._count._all || 0;
      const revenue = num(g._sum.saleValue ?? 0);
      const avgDeal = salesCount ? Math.round(revenue / salesCount) : 0;
      const rv1HonorRate = rv1Planned ? Number(((rv1Honored / rv1Planned) * 100).toFixed(1)) : null;

      rows.push({
        setterId: g.setterId!,
        setterName: setter.firstName,
        setterEmail: setter.email,
        closerId: g.closerId!,
        closerName: closer.firstName,
        closerEmail: closer.email,

        salesCount,
        revenue,
        avgDeal,

        rv1Planned,
        rv1Honored,
        rv1HonorRate,
      });
    }

    rows.sort((a, b) => (b.revenue !== a.revenue ? b.revenue - a.revenue : b.salesCount - a.salesCount));
    return rows.slice(0, top);
  }

  /* =========================================================================
     ============================= PIPELINE STAGE TOTALS ======================
     ========================================================================= */
  async pipelineStageTotals(from?: string, to?: string) {
    const r = toRange(from, to);
    const where: any = {};
    if (r.from || r.to) {
      where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
    }

    const rows = await (this.prisma as any).leadStageHistory.groupBy({
      by: ['stage'],
      where,
      _count: { _all: true },
    });

    return {
      ok: true,
      stages: rows.map((r0: any) => ({
        stage: r0.stage,
        count: r0._count._all,
      })),
    };
  }

  /* =========================================================================
     ============================= CLOSERS REPORT ============================
     ========================================================================= */
  async closersReport(from?: string, to?: string): Promise<CloserRow[]> {
    const r = toRange(from, to);
    const closers = await this.prisma.user.findMany({
      where: { role: Role.CLOSER, isActive: true },
      select: { id: true, firstName: true, email: true },
      orderBy: { firstName: 'asc' },
    });
    const spend = await this.sumSpend(r);

    const eventToKey: Array<{ type: string; bucket: 'rv1Planned' | 'rv1Honored' | 'rv1NoShow' }> = [
      { type: 'RV1_PLANNED', bucket: 'rv1Planned' },
      { type: 'RV1_HONORED', bucket: 'rv1Honored' },
      { type: 'RV1_NO_SHOW', bucket: 'rv1NoShow' },
    ];

    const maps = {
      rv1Planned: new Map<string, number>(),
      rv1Honored: new Map<string, number>(),
      rv1NoShow: new Map<string, number>(),
    };

    const eventsByType: Record<'rv1Planned' | 'rv1Honored' | 'rv1NoShow', Array<{ leadId: string }>> = {
      rv1Planned: [],
      rv1Honored: [],
      rv1NoShow: [],
    };

    for (const { type, bucket } of eventToKey) {
      const evs = await (this.prisma as any).leadEvent.findMany({
        where: { type, ...between('occurredAt', r) },
        select: { leadId: true },
      });
      eventsByType[bucket] = evs.filter((e: any) => !!e.leadId);
    }

    const allLeadIds = Array.from(
      new Set(
        ([] as string[]).concat(
          eventsByType.rv1Planned.map((e) => e.leadId),
          eventsByType.rv1Honored.map((e) => e.leadId),
          eventsByType.rv1NoShow.map((e) => e.leadId),
        ),
      ),
    );

    const leadCloserMap = new Map<string, string>();
    if (allLeadIds.length) {
      const leads = await this.prisma.lead.findMany({
        where: { id: { in: allLeadIds } },
        select: { id: true, closerId: true },
      });
      for (const l of leads) {
        leadCloserMap.set(l.id, l.closerId || 'UNASSIGNED');
      }
    }

    for (const bucket of ['rv1Planned', 'rv1Honored', 'rv1NoShow'] as const) {
      for (const e of eventsByType[bucket]) {
        const cid = leadCloserMap.get(e.leadId) || 'UNASSIGNED';
        maps[bucket].set(cid, (maps[bucket].get(cid) || 0) + 1);
      }
    }

    const rows: CloserRow[] = [];
    for (const c of closers) {
      const rv1Planned = maps.rv1Planned.get(c.id) || 0;
      const rv1Honored = maps.rv1Honored.get(c.id) || 0;
      const rv1NoShow = maps.rv1NoShow.get(c.id) || 0;

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

      const roasPlanned = rv1Planned ? Number(((revenueTotal || 0) / (spend || 1) / rv1Planned).toFixed(2)) : null;
      const roasHonored = rv1Honored ? Number(((revenueTotal || 0) / (spend || 1) / rv1Honored).toFixed(2)) : null;

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

    if (
      maps.rv1Planned.has('UNASSIGNED') ||
      maps.rv1Honored.has('UNASSIGNED') ||
      maps.rv1NoShow.has('UNASSIGNED')
    ) {
      rows.push({
        userId: 'UNASSIGNED',
        name: 'Non assigné',
        email: '',
        rv1Planned: num(maps.rv1Planned.get('UNASSIGNED') || 0),
        rv1Honored: num(maps.rv1Honored.get('UNASSIGNED') || 0),
        rv1NoShow: num(maps.rv1NoShow.get('UNASSIGNED') || 0),
        rv2Planned: 0,
        rv2Honored: 0,
        salesClosed: 0,
        revenueTotal: 0,
        roasPlanned: null,
        roasHonored: null,
      });
    }

    return rows;
  }

  /* =========================================================================
     ================================ SUMMARY =================================
     ========================================================================= */
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

  /* =========================================================================
     =============== PIPELINE METRICS (utilise LeadStageHistory) =============
     ========================================================================= */
  async pipelineMetrics(args: {
    keys: string[];
    from?: string;
    to?: string;
    mode?: 'entered' | 'current';
  }): Promise<Record<string, number>> {
    const { keys, from, to, mode = 'entered' } = args;
    const r = toRange(from, to);
    const out: Record<string, number> = {};

    // dans ce contexte “current” n’a pas vraiment de sens avec l’historique,
    // donc on renvoie le cumul quand même
    await Promise.all(
      Array.from(new Set(keys)).map(async (k) => {
        out[k] = await this.countHistory(k, r);
      }),
    );
    return out;
  }

  /* =========================================================================
     ===================== FUNNEL (tout via LeadStageHistory) =================
     ========================================================================= */
  private async funnelFromHistory(r: Range): Promise<FunnelTotals> {
    const [
      leadsCreated,
      callReq,
      calls,
      answered,
      setterNoShow,
      rv0P,
      rv0H,
      rv0NS,
      rv1P,
      rv1H,
      rv1NS,
      rv2P,
      rv2H,
      notQual,
      lost,
      wonCount,
    ] = await Promise.all([
      // leads = création
      this.prisma.lead.count({ where: between('createdAt', r) }),
      this.countHistory('CALL_REQUESTED', r),
      this.countHistory('CALL_ATTEMPT', r),
      this.countHistory('CALL_ANSWERED', r),
      this.countHistory('SETTER_NO_SHOW', r),
      this.countHistory('RV0_PLANNED', r),
      this.countHistory('RV0_HONORED', r),
      this.countHistory('RV0_NO_SHOW', r),
      this.countHistory('RV1_PLANNED', r),
      this.countHistory('RV1_HONORED', r),
      this.countHistory('RV1_NO_SHOW', r),
      this.countHistory('RV2_PLANNED', r),
      this.countHistory('RV2_HONORED', r),
      this.countHistory('NOT_QUALIFIED', r),
      this.countHistory('LOST', r),
      this.countHistory('WON', r),
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
    const totals = await this.funnelFromHistory(r);

    const start = mondayOfUTC(r.from ?? new Date());
    const end = sundayOfUTC(r.to ?? new Date());

    const weekly: FunnelWeeklyRow[] = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
      const ws = mondayOfUTC(d);
      const we = sundayOfUTC(d);
      const clip = intersectWindow(ws, we, r.from, r.to);
      const wRange: Range = { from: clip?.start, to: clip?.end };
      const wTotals = await this.funnelFromHistory(wRange);
      weekly.push({ weekStart: ws.toISOString(), weekEnd: we.toISOString(), ...wTotals });
    }

    return { period: { from, to }, totals, weekly };
  }

  /* =========================================================================
     ======================== WEEKLY OPS (pour /reporting/weekly-ops) =========
     ========================================================================= */
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
        rv0Planned: await this.countHistoryMany(['RV0_PLANNED'], wRange),
        rv0Honored: await this.countHistoryMany(['RV0_HONORED'], wRange),
        rv0NoShow: await this.countHistoryMany(['RV0_NO_SHOW'], wRange),
        rv1Planned: await this.countHistoryMany(['RV1_PLANNED'], wRange),
        rv1Honored: await this.countHistoryMany(['RV1_HONORED'], wRange),
        rv1NoShow: await this.countHistoryMany(['RV1_NO_SHOW'], wRange),
        rv1Postponed: await this.countHistoryMany(['RV1_POSTPONED'], wRange),
        rv2Planned: await this.countHistoryMany(['RV2_PLANNED'], wRange),
        rv2Honored: await this.countHistoryMany(['RV2_HONORED'], wRange),
        rv2Postponed: await this.countHistoryMany(['RV2_POSTPONED'], wRange),
        notQualified: await this.countHistoryMany(['NOT_QUALIFIED'], wRange),
        lost: await this.countHistoryMany(['LOST'], wRange),
      };
      out.push(row);
    }
    return out;
  }

  /* =========================================================================
     =================== METRICS JOURNALIÈRES /reporting/metric/* =============
     ========================================================================= */

  async metricCallRequests(from?: string, to?: string) {
    return this.perDayFromHistory('CALL_REQUESTED', from, to);
  }

  async metricCalls(from?: string, to?: string) {
    return this.perDayFromHistory('CALL_ATTEMPT', from, to);
  }

  async metricCallsAnswered(from?: string, to?: string) {
    return this.perDayFromHistory('CALL_ANSWERED', from, to);
  }

  /* =========================================================================
     =============================== DRILLS ===================================
     ========================================================================= */

  async drillLeadsReceived(args: { from?: string; to?: string; limit: number }) {
    const r = toRange(args.from, args.to);
    const rows = await this.prisma.lead.findMany({
      where: between('createdAt', r),
      orderBy: { createdAt: 'desc' },
      take: args.limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        setter: { select: { id: true, firstName: true, email: true } },
        closer: { select: { id: true, firstName: true, email: true } },
        saleValue: true,
      },
    });
    const items = rows.map((L) => ({
      leadId: L.id,
      leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
      email: L.email,
      phone: L.phone,
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
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        setter: { select: { id: true, firstName: true, email: true } },
        closer: { select: { id: true, firstName: true, email: true } },
        saleValue: true,
        createdAt: true,
        stageUpdatedAt: true,
      },
    });
    const items = rows.map((L) => ({
      leadId: L.id,
      leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
      email: L.email,
      phone: L.phone,
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
        type: true,
        status: true,
        scheduledAt: true,
        userId: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true,
            createdAt: true,
            stageUpdatedAt: true,
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
          email: L.email,
          phone: L.phone,
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
        requestedAt: true,
        channel: true,
        status: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true,
            createdAt: true,
            stageUpdatedAt: true,
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
          email: L.email,
          phone: L.phone,
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
          startedAt: true,
          outcome: true,
          userId: true,
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              setter: { select: { id: true, firstName: true, email: true } },
              closer: { select: { id: true, firstName: true, email: true } },
              saleValue: true,
              createdAt: true,
              stageUpdatedAt: true,
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
            email: L.email,
            phone: L.phone,
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
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          setter: { select: { id: true, firstName: true, email: true } },
          closer: { select: { id: true, firstName: true, email: true } },
          saleValue: true,
          createdAt: true,
          stageUpdatedAt: true,
        },
      });
      const items = rows.map((L) => ({
        leadId: L.id,
        leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
        email: L.email,
        phone: L.phone,
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
        startedAt: true,
        outcome: true,
        userId: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            setter: { select: { id: true, firstName: true, email: true } },
            closer: { select: { id: true, firstName: true, email: true } },
            saleValue: true,
            createdAt: true,
            stageUpdatedAt: true,
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
          email: L.email,
          phone: L.phone,
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
