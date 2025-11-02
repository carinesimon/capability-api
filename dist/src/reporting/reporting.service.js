"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function toUTCDateOnly(s) {
    if (!s)
        return undefined;
    if (s.includes('T')) {
        const d = new Date(s);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    }
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
const startOfDayUTC = (s) => (s ? toUTCDateOnly(s) : undefined);
function endOfDayUTC(s) {
    if (!s)
        return undefined;
    const d0 = toUTCDateOnly(s);
    const d1 = new Date(d0.getTime());
    d1.setUTCHours(23, 59, 59, 999);
    return d1;
}
function toRange(from, to) {
    return { from: startOfDayUTC(from), to: endOfDayUTC(to) };
}
function between(field, r) {
    if (!r.from && !r.to)
        return {};
    return { [field]: { gte: r.from ?? undefined, lte: r.to ?? undefined } };
}
function mondayOfUTC(d) {
    const x = new Date(d);
    const w = (x.getUTCDay() + 6) % 7;
    x.setUTCDate(x.getUTCDate() - w);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}
function sundayOfUTC(d) {
    const m = mondayOfUTC(d);
    const s = new Date(m);
    s.setUTCDate(s.getUTCDate() + 6);
    s.setUTCHours(23, 59, 59, 999);
    return s;
}
function intersectWindow(aStart, aEnd, bStart, bEnd) {
    const s = new Date(Math.max(aStart.getTime(), (bStart ?? aStart).getTime()));
    const e = new Date(Math.min(aEnd.getTime(), (bEnd ?? aEnd).getTime()));
    return s > e ? null : { start: s, end: e };
}
const HISTORY_ALIASES = {
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
function normalizeToken(s) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}
let ReportingService = class ReportingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async wonStageIds() {
        try {
            const rows = await this.prisma.stage.findMany({
                where: { isActive: true, isWon: true },
                select: { id: true },
            });
            return rows.map((r) => r.id);
        }
        catch {
            return [];
        }
    }
    async wonFilter(r) {
        const wonIds = await this.wonStageIds();
        const base = wonIds.length
            ? { stageId: { in: wonIds } }
            : { stage: client_1.LeadStage.WON };
        if (!r.from && !r.to)
            return base;
        return { AND: [base, between('stageUpdatedAt', r)] };
    }
    async sumSpend(r) {
        const budgets = await this.prisma.budget.findMany({
            where: { period: client_1.BudgetPeriod.WEEKLY },
        });
        if (!r.from && !r.to) {
            return budgets.reduce((s, b) => s + num(b.amount), 0);
        }
        let sum = 0;
        for (const b of budgets) {
            if (!b.weekStart)
                continue;
            const ws = mondayOfUTC(new Date(b.weekStart));
            const we = sundayOfUTC(new Date(b.weekStart));
            if ((r.from ? ws <= r.to : true) && (r.to ? we >= r.from : true)) {
                sum += num(b.amount);
            }
        }
        return sum;
    }
    async leadsReceived(from, to) {
        const r = toRange(from, to);
        const total = await this.prisma.lead.count({ where: between('createdAt', r) });
        const days = [];
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
    variantsFor(canonical) {
        const base = canonical.toUpperCase();
        const aliases = HISTORY_ALIASES[base] || [];
        const more = aliases.map(normalizeToken);
        return Array.from(new Set([base, ...aliases, ...more]));
    }
    historyWhere(canonical, r) {
        const stages = this.variantsFor(canonical);
        const where = { stage: { in: stages } };
        if (r && (r.from || r.to)) {
            where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
        }
        return where;
    }
    async countHistory(canonical, r) {
        const where = this.historyWhere(canonical, r);
        return await this.prisma.leadStageHistory.count({ where });
    }
    async perDayFromHistory(canonical, from, to) {
        const r = toRange(from, to);
        if (!r.from || !r.to) {
            const total = await this.countHistory(canonical, r);
            return { total, byDay: [] };
        }
        const days = [];
        let total = 0;
        const start = new Date(r.from);
        const end = new Date(r.to);
        const stages = this.variantsFor(canonical);
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            const d0 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
            const d1 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getDate(), 23, 59, 59, 999));
            const n = await this.prisma.leadStageHistory.count({
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
    async countHistoryMany(canonicals, r) {
        const variants = canonicals.flatMap((c) => this.variantsFor(c));
        const where = { stage: { in: variants } };
        if (r.from || r.to) {
            where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
        }
        return await this.prisma.leadStageHistory.count({ where });
    }
    async salesWeekly(from, to) {
        const r = toRange(from, to);
        const start = mondayOfUTC(r.from ?? new Date());
        const end = sundayOfUTC(r.to ?? new Date());
        const out = [];
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
    async settersReport(from, to) {
        const r = toRange(from, to);
        const spend = await this.sumSpend(r);
        const setters = await this.prisma.user.findMany({
            where: { role: client_1.Role.SETTER, isActive: true },
            select: { id: true, firstName: true, email: true, role: true },
            orderBy: { firstName: 'asc' },
        });
        const setterIds = new Set(setters.map((s) => s.id));
        const allLeads = await this.prisma.lead.findMany({
            where: between('createdAt', r),
            select: { id: true, setterId: true, createdAt: true },
        });
        const totalLeads = allLeads.length;
        const rv0PlannedEvents = await this.prisma.leadEvent.findMany({
            where: { type: 'RV0_PLANNED', ...between('occurredAt', r) },
            select: { leadId: true },
        });
        const rv0LeadIds = rv0PlannedEvents.map((e) => e.leadId).filter(Boolean);
        const rv0Leads = rv0LeadIds.length
            ? await this.prisma.lead.findMany({
                where: { id: { in: rv0LeadIds } },
                select: { id: true, setterId: true },
            })
            : [];
        const setterByLead = new Map(rv0Leads.map((l) => [l.id, l.setterId || 'UNASSIGNED']));
        const rv0PlannedBySetter = new Map();
        for (const e of rv0PlannedEvents) {
            const sid = setterByLead.get(e.leadId) || 'UNASSIGNED';
            rv0PlannedBySetter.set(sid, (rv0PlannedBySetter.get(sid) || 0) + 1);
        }
        const rv1HonoredBySetter = new Map();
        {
            const evs = await this.prisma.leadEvent.findMany({
                where: { type: 'RV1_HONORED', ...between('occurredAt', r) },
                select: { lead: { select: { setterId: true } } },
            });
            for (const ev of evs) {
                const sid = ev.lead?.setterId || 'UNASSIGNED';
                rv1HonoredBySetter.set(sid, (rv1HonoredBySetter.get(sid) || 0) + 1);
            }
        }
        const reqEvents = await this.prisma.leadEvent.findMany({
            where: { type: 'CALL_REQUESTED', ...between('occurredAt', r) },
            orderBy: { occurredAt: 'asc' },
            select: { leadId: true, occurredAt: true },
        });
        const firstReqByLead = new Map();
        for (const ev of reqEvents) {
            if (ev.leadId && !firstReqByLead.has(ev.leadId))
                firstReqByLead.set(ev.leadId, ev.occurredAt);
        }
        const leadsWithRequest = Array.from(firstReqByLead.keys());
        const attemptEvents = leadsWithRequest.length
            ? await this.prisma.leadEvent.findMany({
                where: { type: 'CALL_ATTEMPT', leadId: { in: leadsWithRequest } },
                orderBy: { occurredAt: 'asc' },
                select: { leadId: true, occurredAt: true },
            })
            : [];
        const firstAttemptEventByLead = new Map();
        for (const ev of attemptEvents) {
            if (!ev.leadId)
                continue;
            const reqAt = firstReqByLead.get(ev.leadId);
            if (!reqAt)
                continue;
            if (ev.occurredAt < reqAt)
                continue;
            if (r.to && ev.occurredAt > r.to)
                continue;
            if (!firstAttemptEventByLead.has(ev.leadId))
                firstAttemptEventByLead.set(ev.leadId, ev.occurredAt);
        }
        const ttfcBySetter = {};
        const isSetter = (userId) => setterIds.has(userId);
        for (const leadId of leadsWithRequest) {
            const requestAt = firstReqByLead.get(leadId);
            const attemptEventAt = firstAttemptEventByLead.get(leadId);
            if (!requestAt || !attemptEventAt)
                continue;
            const endWindow = new Date(attemptEventAt.getTime() + 5 * 60 * 1000);
            const ca = await this.prisma.callAttempt.findFirst({
                where: { leadId, startedAt: { gte: requestAt, lte: endWindow } },
                orderBy: { startedAt: 'asc' },
                select: { userId: true, startedAt: true },
            });
            let ownerSetterId = null;
            if (ca?.userId && isSetter(ca.userId))
                ownerSetterId = ca.userId;
            if (!ownerSetterId) {
                const l = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { setterId: true } });
                if (l?.setterId && isSetter(l.setterId))
                    ownerSetterId = l.setterId;
            }
            if (!ownerSetterId)
                continue;
            const diffMin = Math.round((attemptEventAt.getTime() - requestAt.getTime()) / 60000);
            if (diffMin < 0)
                continue;
            const a = ttfcBySetter[ownerSetterId] || { sum: 0, n: 0 };
            a.sum += diffMin;
            a.n += 1;
            ttfcBySetter[ownerSetterId] = a;
        }
        const rows = [];
        for (const s of setters) {
            const leads = allLeads.filter((l) => l.setterId === s.id);
            const leadIds = leads.map((l) => l.id);
            const leadsReceived = leadIds.length;
            const rv0Count = rv0PlannedBySetter.get(s.id) || 0;
            const rv1FromHisLeads = rv1HonoredBySetter.get(s.id) || 0;
            const ttfcAgg = ttfcBySetter[s.id];
            const ttfcAvgMinutes = ttfcAgg?.n ? Math.round(ttfcAgg.sum / ttfcAgg.n) : null;
            const wonWhere = await this.wonFilter(r);
            wonWhere.setterId = s.id;
            const wonAgg = await this.prisma.lead.aggregate({
                _sum: { saleValue: true },
                _count: { _all: true },
                where: wonWhere,
            });
            const revenueFromHisLeads = num(wonAgg._sum?.saleValue ?? 0);
            const salesFromHisLeads = num(wonAgg._count?._all ?? 0);
            const spendShare = totalLeads && leadsReceived ? spend * (leadsReceived / totalLeads) : leadsReceived ? spend : 0;
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
                salesFromHisLeads,
            });
        }
        return rows;
    }
    async duosReport(from, to, top = 10) {
        const r = toRange(from, to);
        const baseWon = await this.wonFilter(r);
        const whereWon = {
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
        if (!groups.length)
            return [];
        const userIds = Array.from(new Set(groups.flatMap((g) => [g.setterId, g.closerId])));
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, email: true },
        });
        const uById = new Map(users.map((u) => [u.id, u]));
        const rows = [];
        for (const g of groups) {
            const setter = uById.get(g.setterId) || { firstName: '—', email: '—' };
            const closer = uById.get(g.closerId) || { firstName: '—', email: '—' };
            const wonLeads = await this.prisma.lead.findMany({
                where: {
                    ...whereWon,
                    setterId: g.setterId,
                    closerId: g.closerId,
                },
                select: { id: true },
            });
            const wonLeadIds = wonLeads.map((l) => l.id);
            let rv1Planned = 0;
            let rv1Honored = 0;
            if (wonLeadIds.length) {
                rv1Planned = await this.prisma.appointment.count({
                    where: {
                        type: client_1.AppointmentType.RV1,
                        leadId: { in: wonLeadIds },
                        ...between('scheduledAt', toRange(from, to)),
                    },
                });
                rv1Honored = await this.prisma.appointment.count({
                    where: {
                        type: client_1.AppointmentType.RV1,
                        status: client_1.AppointmentStatus.HONORED,
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
                setterId: g.setterId,
                setterName: setter.firstName,
                setterEmail: setter.email,
                closerId: g.closerId,
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
    async pipelineStageTotals(from, to) {
        const r = toRange(from, to);
        const where = {};
        if (r.from || r.to) {
            where.occurredAt = { gte: r.from ?? undefined, lte: r.to ?? undefined };
        }
        const rows = await this.prisma.leadStageHistory.groupBy({
            by: ['stage'],
            where,
            _count: { _all: true },
        });
        return {
            ok: true,
            stages: rows.map((r0) => ({
                stage: r0.stage,
                count: r0._count._all,
            })),
        };
    }
    async closersReport(from, to) {
        const r = toRange(from, to);
        const closers = await this.prisma.user.findMany({
            where: { role: client_1.Role.CLOSER, isActive: true },
            select: { id: true, firstName: true, email: true },
            orderBy: { firstName: 'asc' },
        });
        const spend = await this.sumSpend(r);
        const eventToKey = [
            { type: 'RV1_PLANNED', bucket: 'rv1Planned' },
            { type: 'RV1_HONORED', bucket: 'rv1Honored' },
            { type: 'RV1_NO_SHOW', bucket: 'rv1NoShow' },
        ];
        const maps = {
            rv1Planned: new Map(),
            rv1Honored: new Map(),
            rv1NoShow: new Map(),
        };
        const eventsByType = {
            rv1Planned: [],
            rv1Honored: [],
            rv1NoShow: [],
        };
        for (const { type, bucket } of eventToKey) {
            const evs = await this.prisma.leadEvent.findMany({
                where: { type, ...between('occurredAt', r) },
                select: { leadId: true },
            });
            eventsByType[bucket] = evs.filter((e) => !!e.leadId);
        }
        const allLeadIds = Array.from(new Set([].concat(eventsByType.rv1Planned.map((e) => e.leadId), eventsByType.rv1Honored.map((e) => e.leadId), eventsByType.rv1NoShow.map((e) => e.leadId))));
        const leadCloserMap = new Map();
        if (allLeadIds.length) {
            const leads = await this.prisma.lead.findMany({
                where: { id: { in: allLeadIds } },
                select: { id: true, closerId: true },
            });
            for (const l of leads) {
                leadCloserMap.set(l.id, l.closerId || 'UNASSIGNED');
            }
        }
        for (const bucket of ['rv1Planned', 'rv1Honored', 'rv1NoShow']) {
            for (const e of eventsByType[bucket]) {
                const cid = leadCloserMap.get(e.leadId) || 'UNASSIGNED';
                maps[bucket].set(cid, (maps[bucket].get(cid) || 0) + 1);
            }
        }
        const rows = [];
        for (const c of closers) {
            const rv1Planned = maps.rv1Planned.get(c.id) || 0;
            const rv1Honored = maps.rv1Honored.get(c.id) || 0;
            const rv1NoShow = maps.rv1NoShow.get(c.id) || 0;
            const rv2Planned = await this.prisma.appointment.count({
                where: { userId: c.id, type: client_1.AppointmentType.RV2, ...between('scheduledAt', r) },
            });
            const rv2Honored = await this.prisma.appointment.count({
                where: {
                    userId: c.id,
                    type: client_1.AppointmentType.RV2,
                    status: client_1.AppointmentStatus.HONORED,
                    ...between('scheduledAt', r),
                },
            });
            const wonWhere = await this.wonFilter(r);
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
        if (maps.rv1Planned.has('UNASSIGNED') ||
            maps.rv1Honored.has('UNASSIGNED') ||
            maps.rv1NoShow.has('UNASSIGNED')) {
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
    async summary(from, to) {
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
                settersCount: setters.length,
                closersCount: closers.length,
                rv1Honored: closers.reduce((s, r0) => s + num(r0.rv1Honored || 0), 0),
            },
        };
    }
    async pipelineMetrics(args) {
        const { keys, from, to, mode = 'entered' } = args;
        const r = toRange(from, to);
        const out = {};
        await Promise.all(Array.from(new Set(keys)).map(async (k) => {
            out[k] = await this.countHistory(k, r);
        }));
        return out;
    }
    async funnelFromHistory(r) {
        const [leadsCreated, callReq, calls, answered, setterNoShow, rv0P, rv0H, rv0NS, rv1P, rv1H, rv1NS, rv2P, rv2H, notQual, lost, wonCount,] = await Promise.all([
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
    async funnel(from, to) {
        const r = toRange(from, to);
        const totals = await this.funnelFromHistory(r);
        const start = mondayOfUTC(r.from ?? new Date());
        const end = sundayOfUTC(r.to ?? new Date());
        const weekly = [];
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
            const ws = mondayOfUTC(d);
            const we = sundayOfUTC(d);
            const clip = intersectWindow(ws, we, r.from, r.to);
            const wRange = { from: clip?.start, to: clip?.end };
            const wTotals = await this.funnelFromHistory(wRange);
            weekly.push({ weekStart: ws.toISOString(), weekEnd: we.toISOString(), ...wTotals });
        }
        return { period: { from, to }, totals, weekly };
    }
    async weeklySeries(from, to) {
        const r = toRange(from, to);
        const start = mondayOfUTC(r.from ?? new Date());
        const end = sundayOfUTC(r.to ?? new Date());
        const out = [];
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
            const ws = mondayOfUTC(d);
            const we = sundayOfUTC(d);
            const clip = intersectWindow(ws, we, r.from, r.to);
            const wRange = { from: clip?.start, to: clip?.end };
            const row = {
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
    async metricCallRequests(from, to) {
        return this.perDayFromHistory('CALL_REQUESTED', from, to);
    }
    async metricCalls(from, to) {
        return this.perDayFromHistory('CALL_ATTEMPT', from, to);
    }
    async metricCallsAnswered(from, to) {
        return this.perDayFromHistory('CALL_ANSWERED', from, to);
    }
    async drillLeadsReceived(args) {
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
    async drillWon(args) {
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
    async drillAppointments(args) {
        const r = toRange(args.from, args.to);
        const where = {
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
            const L = r0.lead;
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
    async drillCallRequests(args) {
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
            const L = r0.lead;
            return {
                leadId: L.id,
                leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                email: L.email,
                phone: L.phone,
                setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
                closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
                appointment: { type: 'CALL_REQUEST', status: r0.status, scheduledAt: r0.requestedAt.toISOString() },
                saleValue: L.saleValue ?? null,
                createdAt: L.createdAt.toISOString(),
                stageUpdatedAt: L.stageUpdatedAt.toISOString(),
            };
        });
        return { ok: true, count: items.length, items };
    }
    async drillCalls(args) {
        if (args.answered) {
            const r = toRange(args.from, args.to);
            const rows = await this.prisma.callAttempt.findMany({
                where: { outcome: client_1.CallOutcome.ANSWERED, ...between('startedAt', r) },
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
                const L = r0.lead;
                return {
                    leadId: L.id,
                    leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                    email: L.email,
                    phone: L.phone,
                    setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
                    closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
                    appointment: { type: 'CALL', status: r0.outcome, scheduledAt: r0.startedAt.toISOString() },
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
                where: { stage: client_1.LeadStage.SETTER_NO_SHOW, ...between('stageUpdatedAt', r) },
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
            const L = r0.lead;
            return {
                leadId: L.id,
                leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                email: L.email,
                phone: L.phone,
                setter: L.setter ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email } : null,
                closer: L.closer ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email } : null,
                appointment: { type: 'CALL', status: r0.outcome, scheduledAt: r0.startedAt.toISOString() },
                saleValue: L.saleValue ?? null,
                createdAt: L.createdAt.toISOString(),
                stageUpdatedAt: L.stageUpdatedAt.toISOString(),
            };
        });
        return { ok: true, count: items.length, items };
    }
};
exports.ReportingService = ReportingService;
exports.ReportingService = ReportingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportingService);
//# sourceMappingURL=reporting.service.js.map