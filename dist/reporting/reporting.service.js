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
        const rv1Events = await this.prisma.stageEvent.findMany({
            where: {
                toStage: client_1.LeadStage.RV1_HONORED,
                ...between('occurredAt', r),
            },
            select: {
                leadId: true,
                lead: {
                    select: { setterId: true },
                },
            },
        });
        const rv1FromHisLeadsBySetter = new Map();
        for (const ev of rv1Events) {
            if (!ev.lead || !ev.lead.setterId || !ev.leadId)
                continue;
            const sId = ev.lead.setterId;
            if (!rv1FromHisLeadsBySetter.has(sId)) {
                rv1FromHisLeadsBySetter.set(sId, new Set());
            }
            rv1FromHisLeadsBySetter.get(sId).add(ev.leadId);
        }
        const reqEvents = await this.prisma.leadEvent.findMany({
            where: {
                type: 'CALL_REQUESTED',
                ...between('occurredAt', r),
            },
            orderBy: { occurredAt: 'asc' },
            select: { leadId: true, occurredAt: true },
        });
        const firstReqByLead = new Map();
        for (const ev of reqEvents) {
            if (!ev.leadId)
                continue;
            if (!firstReqByLead.has(ev.leadId))
                firstReqByLead.set(ev.leadId, ev.occurredAt);
        }
        const leadsWithRequest = Array.from(firstReqByLead.keys());
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
            if (!firstAttemptEventByLead.has(ev.leadId)) {
                firstAttemptEventByLead.set(ev.leadId, ev.occurredAt);
            }
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
                where: {
                    leadId,
                    startedAt: { gte: requestAt, lte: endWindow },
                },
                orderBy: { startedAt: 'asc' },
                select: { userId: true, startedAt: true },
            });
            let ownerSetterId = null;
            if (ca?.userId && isSetter(ca.userId))
                ownerSetterId = ca.userId;
            if (!ownerSetterId) {
                const l = await this.prisma.lead.findUnique({
                    where: { id: leadId },
                    select: { setterId: true },
                });
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
            const rv0Count = await this.prisma.appointment.count({
                where: { userId: s.id, type: client_1.AppointmentType.RV0, ...between('scheduledAt', r) },
            });
            const rv1Set = rv1FromHisLeadsBySetter.get(s.id);
            const rv1FromHisLeads = rv1Set ? rv1Set.size : 0;
            const ttfcAgg = ttfcBySetter[s.id];
            const ttfcAvgMinutes = ttfcAgg?.n ? Math.round(ttfcAgg.sum / ttfcAgg.n) : null;
            const wonWhere = await this.wonFilter(r);
            wonWhere.setterId = s.id;
            const wonAgg = await this.prisma.lead.aggregate({
                _sum: { saleValue: true },
                where: wonWhere,
            });
            const revenueFromHisLeads = num(wonAgg._sum?.saleValue ?? 0);
            const spendShare = totalLeads && leadsReceived
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
    async closersReport(from, to) {
        const r = toRange(from, to);
        const closers = await this.prisma.user.findMany({
            where: { role: client_1.Role.CLOSER, isActive: true },
            select: { id: true, firstName: true, email: true },
            orderBy: { firstName: 'asc' },
        });
        const spend = await this.sumSpend(r);
        const rv1Events = await this.prisma.stageEvent.findMany({
            where: {
                toStage: client_1.LeadStage.RV1_HONORED,
                ...between('occurredAt', r),
            },
            select: {
                leadId: true,
                lead: {
                    select: { closerId: true },
                },
            },
        });
        const rv1HonoredByCloser = new Map();
        for (const ev of rv1Events) {
            if (!ev.lead || !ev.lead.closerId || !ev.leadId)
                continue;
            const cId = ev.lead.closerId;
            if (!rv1HonoredByCloser.has(cId)) {
                rv1HonoredByCloser.set(cId, new Set());
            }
            rv1HonoredByCloser.get(cId).add(ev.leadId);
        }
        const rows = [];
        for (const c of closers) {
            const rv1Planned = await this.prisma.appointment.count({
                where: { userId: c.id, type: client_1.AppointmentType.RV1, ...between('scheduledAt', r) },
            });
            const rv1Set = rv1HonoredByCloser.get(c.id);
            const rv1Honored = rv1Set ? rv1Set.size : 0;
            const rv1NoShow = await this.prisma.appointment.count({
                where: {
                    userId: c.id,
                    type: client_1.AppointmentType.RV1,
                    status: client_1.AppointmentStatus.NO_SHOW,
                    ...between('scheduledAt', r),
                },
            });
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
    async duosReport(from, to) {
        const r = toRange(from, to);
        const where = await this.wonFilter(r);
        where.setterId = { not: null };
        where.closerId = { not: null };
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
        const map = new Map();
        for (const L of leads) {
            if (!L.setterId || !L.closerId || !L.setter || !L.closer)
                continue;
            const key = `${L.setterId}::${L.closerId}`;
            const row = map.get(key) ??
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
        for (const duo of map.values()) {
            if (!duo.leadIds.length)
                continue;
            const rv1Planned = await this.prisma.appointment.count({
                where: {
                    type: client_1.AppointmentType.RV1,
                    leadId: { in: duo.leadIds },
                },
            });
            const rv1Honored = await this.prisma.appointment.count({
                where: {
                    type: client_1.AppointmentType.RV1,
                    leadId: { in: duo.leadIds },
                    status: client_1.AppointmentStatus.HONORED,
                },
            });
            duo.rv1Planned = num(rv1Planned);
            duo.rv1Honored = num(rv1Honored);
        }
        const out = Array.from(map.values()).map((d) => ({
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
        return out.sort((a, b) => b.revenue - a.revenue);
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
    async stageIdsForKeys(keys) {
        if (!keys?.length)
            return [];
        const rows = await this.prisma.stage.findMany({
            where: { slug: { in: keys }, isActive: true },
            select: { id: true },
        });
        return rows.map(r => r.id);
    }
    async countEnteredInStages(keys, r) {
        if (!keys?.length)
            return 0;
        const ids = await this.stageIdsForKeys(keys);
        const where = {
            AND: [
                { OR: [{ stage: { in: keys } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
                between('stageUpdatedAt', r),
            ],
        };
        return num(await this.prisma.lead.count({ where }));
    }
    async countCurrentInStages(keys) {
        if (!keys?.length)
            return 0;
        const ids = await this.stageIdsForKeys(keys);
        const where = { OR: [{ stage: { in: keys } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] };
        return num(await this.prisma.lead.count({ where }));
    }
    async pipelineMetrics(args) {
        const { keys, from, to, mode = 'entered' } = args;
        const r = toRange(from, to);
        const unique = Array.from(new Set(keys));
        const out = {};
        await Promise.all(unique.map(async (k) => {
            out[k] =
                mode === 'current'
                    ? await this.countCurrentInStages([k])
                    : await this.countEnteredInStages([k], r);
        }));
        return out;
    }
    async funnelFromStages(r) {
        const get = (keys) => this.countEnteredInStages(keys, r);
        const [leadsCreated, callReq, calls, answered, setterNoShow, rv0P, rv0H, rv0NS, rv1P, rv1H, rv1NS, rv2P, rv2H, notQual, lost, wonCount,] = await Promise.all([
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
    async funnel(from, to) {
        const r = toRange(from, to);
        const totals = await this.funnelFromStages(r);
        const start = mondayOfUTC(r.from ?? new Date());
        const end = sundayOfUTC(r.to ?? new Date());
        const weekly = [];
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
            const ws = mondayOfUTC(d);
            const we = sundayOfUTC(d);
            const clip = intersectWindow(ws, we, r.from, r.to);
            const wRange = { from: clip?.start, to: clip?.end };
            const wTotals = await this.funnelFromStages(wRange);
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
    async perDayFromStages(keys, from, to) {
        const r = toRange(from, to);
        const ids = await this.stageIdsForKeys(keys);
        if (!r.from || !r.to) {
            const where = {
                AND: [
                    { OR: [{ stage: { in: keys } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
                ],
            };
            const total = await this.prisma.lead.count({ where });
            return { total: num(total), byDay: [] };
        }
        const days = [];
        let total = 0;
        const start = new Date(r.from);
        const end = new Date(r.to);
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            const d0 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
            const d1 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
            const where = {
                AND: [
                    { OR: [{ stage: { in: keys } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] },
                    { stageUpdatedAt: { gte: d0, lte: d1 } },
                ],
            };
            const n = await this.prisma.lead.count({ where });
            total += num(n);
            days.push({ day: d0.toISOString(), count: num(n) });
        }
        return { total, byDay: days };
    }
    async metricCallRequests(from, to) {
        return this.perDayFromStages(['CALL_REQUESTED'], from, to);
    }
    async metricCalls(from, to) {
        return this.perDayFromStages(['CALL_ATTEMPT'], from, to);
    }
    async metricCallsAnswered(from, to) {
        return this.perDayFromStages(['CALL_ANSWERED'], from, to);
    }
    async drillLeadsReceived(args) {
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
    async drillWon(args) {
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
            const L = r0.lead;
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
    async drillCallRequests(args) {
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
            const L = r0.lead;
            return {
                leadId: L.id,
                leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                email: L.email, phone: L.phone,
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
                const L = r0.lead;
                return {
                    leadId: L.id,
                    leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                    email: L.email, phone: L.phone,
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
            const L = r0.lead;
            return {
                leadId: L.id,
                leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                email: L.email, phone: L.phone,
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