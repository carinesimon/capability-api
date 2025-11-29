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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const client_2 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const json2csv_1 = require("json2csv");
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
function isBusinessHour(dateUtc, tz) {
    const localStr = dateUtc.toLocaleString("en-US", { timeZone: tz });
    const local = new Date(localStr);
    const h = local.getHours();
    return h >= 8 && h < 21;
}
async function buildAdvancedPDF(params) {
    return await new Promise((resolve) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 24 });
        const chunks = [];
        let pageIndex = 1;
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(PALETTE.bg);
        const bandH = 68;
        doc.save();
        doc.fillColor(PALETTE.surface).rect(0, 0, doc.page.width, bandH).fill();
        doc.restore();
        doc.fillColor(PALETTE.text).fontSize(16).font('Helvetica-Bold');
        doc.text(params.title, 24, 18, { width: doc.page.width - 48 });
        doc.fontSize(10).font('Helvetica').fillColor(PALETTE.muted);
        doc.text(params.period, { width: doc.page.width - 48 });
        const chipY = 44;
        doc.save();
        doc.roundedRect(24, chipY, doc.page.width - 48, 16, 8).fill(PALETTE.card);
        doc.restore();
        let y = 90;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(PALETTE.text);
        doc.text('Analyse & recommandations', 24, y);
        y += 14;
        doc.fontSize(10).font('Helvetica').fillColor(PALETTE.text);
        y = wrap(doc, params.analysisIntro, 24, y, doc.page.width - 48);
        y += 10;
        doc.save();
        doc.moveTo(24, y).lineTo(doc.page.width - 24, y).strokeColor(PALETTE.line).lineWidth(0.8).stroke();
        doc.restore();
        y += 10;
        const startX = 24;
        const tableW = doc.page.width - 48;
        const headerH = 18;
        function renderTableHeader(yh) {
            doc.save();
            doc.roundedRect(startX, yh - 2, tableW, headerH + 6, 6).fill(PALETTE.surface);
            doc.restore();
            let x = startX + 8;
            params.columns.forEach((c) => {
                doc.fontSize(9).font('Helvetica-Bold').fillColor(PALETTE.text);
                doc.text(c.header, x, yh, { width: c.width - 8, align: c.align || 'left' });
                x += c.width;
            });
            return yh + headerH + 8;
        }
        y = renderTableHeader(y);
        const rowH = 16;
        params.rows.forEach((r, idx) => {
            const zebra = idx % 2 === 0 ? PALETTE.card : PALETTE.bg;
            let rowHeight = rowH;
            const formatted = params.columns.map(c => {
                const raw = r[c.key];
                const val = (c.format ? c.format(raw) : raw) ?? '';
                return String(val);
            });
            const note = params.perRowNotes ? params.perRowNotes(r) : '';
            const noteLines = note ? doc.heightOfString(note, { width: tableW - 16, align: 'left' }) : 0;
            const extraNote = note ? Math.max(12, noteLines + 4) : 0;
            rowHeight += extraNote;
            if (y + rowHeight + 32 > doc.page.height) {
                renderFooter(doc, params, pageIndex);
                doc.addPage();
                pageIndex += 1;
                doc.rect(0, 0, doc.page.width, doc.page.height).fill(PALETTE.bg);
                y = 24;
                y = renderTableHeader(y);
            }
            doc.save();
            doc.roundedRect(startX, y - 2, tableW, rowHeight, 6).fill(zebra);
            doc.restore();
            let x = startX + 8;
            params.columns.forEach((c, i) => {
                doc.fontSize(9).font('Helvetica').fillColor(PALETTE.text);
                doc.text(formatted[i], x, y, { width: c.width - 8, align: c.align || 'left' });
                x += c.width;
            });
            if (note) {
                doc.fontSize(8.5).font('Helvetica').fillColor(PALETTE.muted);
                y = wrap(doc, note, startX + 8, y + rowH - 2, tableW - 16) + 6;
            }
            else {
                y += rowH + 4;
            }
        });
        renderFooter(doc, params, pageIndex);
        doc.end();
        function renderFooter(d, p, page) {
            const txt = `${p.title} — ${p.period}`;
            const pageStr = `Page ${page}`;
            const yy = d.page.height - 20;
            d.save();
            d.fontSize(8).font('Helvetica').fillColor(PALETTE.muted);
            d.text(txt, 24, yy, { width: (d.page.width / 2) - 24, align: 'left' });
            d.text(pageStr, d.page.width / 2, yy, { width: (d.page.width / 2) - 24, align: 'right' });
            d.restore();
        }
    });
}
function setterRowNote(r) {
    const leads = r.leadsReceived || 0;
    const rv1P = r.rv1PlannedOnHisLeads || 0;
    const rv1H = r.rv1HonoredOnHisLeads || 0;
    const rv1C = r.rv1CanceledOnHisLeads || 0;
    const cancel = pct(rv1C, Math.max(1, rv1P));
    const qual = pct(rv1P, Math.max(1, leads));
    const presence = pct(rv1H, Math.max(1, rv1P));
    const tips = [];
    if (leads >= 1 && qual < 25)
        tips.push(`Qualification faible (${qual}%) → revoir script d’amorce & timing TTFC.`);
    if (presence < 60 && rv1P >= 5)
        tips.push(`Présence RV1 basse (${presence}%) → rappels + handoff plus robuste.`);
    if (cancel >= 20)
        tips.push(`Annulations élevées (${cancel}%) → vérifier alignement promesse / cible.`);
    if (!tips.length)
        tips.push(`Bon niveau de rigueur. Continuer la standardisation des SOP.`);
    return `• ${tips.join(' ')}`;
}
function closerRowNote(r) {
    const rv1P = r.rv1Planned || 0;
    const rv1H = r.rv1Honored || 0;
    const sales = r.salesClosed || 0;
    const cancel = pct(r.rv1Canceled || 0, Math.max(1, rv1P));
    const closing = pct(sales, Math.max(1, rv1H));
    const tips = [];
    if (rv1H >= 1 && closing < 25)
        tips.push(`Taux de closing bas (${closing}%) → travailler objections & preuve sociale.`);
    if (cancel >= 20)
        tips.push(`Annulations RV1 élevées (${cancel}%) → boucler avec setters sur la qualif.`);
    if (!tips.length)
        tips.push(`Performance solide. Augmenter le volume au-delà du médian.`);
    return `• ${tips.join(' ')}`;
}
function toLocalDateISO(date, tz) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = fmt.formatToParts(date).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
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
function whereLocalDay(field, from, to, tz = 'Europe/Paris') {
    if (!from || !to)
        return client_1.Prisma.sql `TRUE`;
    return client_1.Prisma.sql `
    ( (${client_1.Prisma.raw(`"${field}"`)} AT TIME ZONE ${tz})::date BETWEEN ${from}::date AND ${to}::date )
  `;
}
function daysSpanLocal(from, to) {
    if (!from || !to)
        return [];
    const out = [];
    const d0 = new Date(from + 'T00:00:00');
    const d1 = new Date(to + 'T00:00:00');
    for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        out.push(`${y}-${m}-${dd}`);
    }
    return out;
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
function pct(num, den) {
    return den ? Math.round((num / den) * 100) : 0;
}
const PALETTE = {
    bg: '#0F1420',
    surface: '#121826',
    card: '#0D1522',
    text: '#E6E8EC',
    muted: '#AAB0BC',
    line: '#223047',
    acc1: '#8B5CF6',
    acc2: '#22C55E',
    acc3: '#38BDF8',
    warn: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
};
function wrap(doc, text, x, y, w, opts = {}) {
    doc.text(text, x, y, { width: w, ...opts });
    return doc.y;
}
let ReportingService = class ReportingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    dateSqlBounds(from, to, tz = 'Europe/Paris') {
        if (!from || !to)
            return { from, to, tz };
        return { from, to, tz };
    }
    async countSE(args) {
        const { stages, r, by, distinctByLead } = args;
        if (!stages?.length)
            return 0;
        const selectCount = distinctByLead
            ? client_1.Prisma.sql `COUNT(DISTINCT se."leadId")::int`
            : client_1.Prisma.sql `COUNT(*)::int`;
        const bySql = [];
        if (by?.setterId)
            bySql.push(client_1.Prisma.sql `l."setterId" = ${by.setterId}`);
        if (by?.closerId)
            bySql.push(client_1.Prisma.sql `l."closerId" = ${by.closerId}`);
        if (by?.userId)
            bySql.push(client_1.Prisma.sql `se."userId" = ${by.userId}`);
        const whereBy = bySql.length ? client_1.Prisma.sql `AND ${client_1.Prisma.join(bySql, ' AND ')}` : client_1.Prisma.empty;
        const stageList = client_1.Prisma.join(stages.map(s => client_1.Prisma.sql `${s}::"LeadStage"`));
        const timeClause = r.from && r.to
            ? client_1.Prisma.sql `se."occurredAt" >= ${r.from} AND se."occurredAt" <= ${r.to}`
            : client_1.Prisma.sql `TRUE`;
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
    SELECT ${selectCount} AS n
    FROM "StageEvent" se
    JOIN "Lead" l ON l."id" = se."leadId"
    WHERE se."toStage" = ANY(ARRAY[${stageList}]::"LeadStage"[])
      AND ${timeClause}
      ${whereBy}
  `);
        return rows?.[0]?.n ?? 0;
    }
    async countSEGroupedBySetterDistinct(args) {
        const { stages, r } = args;
        if (!stages?.length)
            return new Map();
        const stageList = client_1.Prisma.join(stages.map(s => client_1.Prisma.sql `${s}::"LeadStage"`));
        const timeClause = r.from && r.to
            ? client_1.Prisma.sql `se."occurredAt" >= ${r.from} AND se."occurredAt" <= ${r.to}`
            : client_1.Prisma.sql `TRUE`;
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
    SELECT l."setterId" AS "setterId", COUNT(DISTINCT se."leadId")::int AS n
    FROM "StageEvent" se
    JOIN "Lead" l ON l."id" = se."leadId"
    WHERE se."toStage" = ANY(ARRAY[${stageList}]::"LeadStage"[])
      AND ${timeClause}
    GROUP BY l."setterId"
  `);
        const out = new Map();
        for (const row of rows) {
            if (row.setterId)
                out.set(row.setterId, row.n || 0);
        }
        return out;
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
            : { stage: client_2.LeadStage.WON };
        if (!r.from && !r.to)
            return base;
        return { AND: [base, between('stageUpdatedAt', r)] };
    }
    async exportSpotlightSettersCSV({ from, to }) {
        const rows = await this.spotlightSetters(from, to);
        const csv = new json2csv_1.Parser({
            fields: [
                { label: 'Setter', value: 'name' },
                { label: 'Email', value: 'email' },
                { label: 'Leads reçus', value: (r) => r.leadsReceived || 0 },
                { label: 'RV1 planifiés (ses leads)', value: (r) => r.rv1PlannedOnHisLeads || 0 },
                { label: 'RV1 honorés (ses leads)', value: (r) => r.rv1HonoredOnHisLeads || 0 },
                { label: 'RV1 annulés (ses leads)', value: (r) => r.rv1CanceledOnHisLeads || 0 },
                { label: '% annulation RV1', value: (r) => pct(r.rv1CanceledOnHisLeads || 0, r.rv1PlannedOnHisLeads || 0) + '%' },
                { label: 'Ventes (depuis ses leads)', value: (r) => r.salesFromHisLeads || 0 },
                { label: 'CA (depuis ses leads)', value: (r) => r.revenueFromHisLeads || 0 },
                { label: 'TTFC (min)', value: (r) => r.ttfcAvgMinutes ?? '' },
                { label: 'Taux de setting', value: (r) => r.settingRate != null ? Math.round(r.settingRate * 100) + '%' : '' },
            ]
        }).parse(rows || []);
        return Buffer.from(csv, 'utf8');
    }
    async exportSpotlightClosersCSV({ from, to }) {
        const rows = await this.spotlightClosers(from, to);
        const csv = new json2csv_1.Parser({
            fields: [
                { label: 'Closer', value: 'name' },
                { label: 'Email', value: 'email' },
                { label: 'RV1 planifiés', value: (r) => r.rv1Planned || 0 },
                { label: 'RV1 honorés', value: (r) => r.rv1Honored || 0 },
                { label: 'RV1 annulés', value: (r) => r.rv1Canceled || 0 },
                { label: '% annulation RV1', value: (r) => pct(r.rv1Canceled || 0, r.rv1Planned || 0) + '%' },
                { label: 'RV2 planifiés', value: (r) => r.rv2Planned || 0 },
                { label: 'RV2 honorés', value: (r) => r.rv2Honored || 0 },
                { label: 'RV2 annulés', value: (r) => r.rv2Canceled || 0 },
                { label: '% annulation RV2', value: (r) => pct(r.rv2Canceled || 0, r.rv2Planned || 0) + '%' },
                { label: 'Ventes', value: (r) => r.salesClosed || 0 },
                { label: 'CA', value: (r) => r.revenueTotal || 0 },
                { label: 'Taux closing', value: (r) => r.closingRate != null ? Math.round(r.closingRate * 100) + '%' : '' },
            ]
        }).parse(rows || []);
        return Buffer.from(csv, 'utf8');
    }
    async buildSpotlightPDF(title, period, rows, columns, analysis) {
        return await new Promise((resolve) => {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 36 });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.fontSize(16).fillColor('#111').text(title, { underline: false });
            doc.moveDown(0.2);
            doc.fontSize(10).fillColor('#666').text(period);
            doc.moveDown(0.6);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#111').text('Analyse & recommandations');
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').fillColor('#222').text(analysis, { align: 'left' });
            doc.moveDown(0.8);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#111').text('Tableau de performances');
            doc.moveDown(0.3);
            const startX = doc.x;
            const startY = doc.y;
            const colX = [];
            let x = startX;
            columns.forEach((c) => {
                const w = c.width ?? 120;
                colX.push(x);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(c.header, x, startY, { width: w });
                x += w + 8;
            });
            doc.moveTo(startX, startY + 14).lineTo(x - 8, startY + 14).strokeColor('#ddd').stroke();
            doc.moveDown(0.2);
            let y = startY + 18;
            rows.forEach((r) => {
                x = startX;
                columns.forEach((c) => {
                    const w = c.width ?? 120;
                    const raw = r[c.key];
                    const val = c.format ? c.format(raw) : (raw ?? '');
                    doc.fontSize(9).font('Helvetica').fillColor('#000').text(String(val), x, y, { width: w });
                    x += w + 8;
                });
                y += 14;
                if (y > 780) {
                    doc.addPage();
                    y = 48;
                }
            });
            doc.end();
        });
    }
    buildSetterAnalysis(rows) {
        if (!rows?.length)
            return "Aucune donnée disponible sur la période.";
        const totalLeads = rows.reduce((s, r) => s + (Number(r.leadsReceived) || 0), 0);
        const totalPlanned = rows.reduce((s, r) => s + (Number(r.rv1PlannedOnHisLeads) || 0), 0);
        const totalHonored = rows.reduce((s, r) => s + (Number(r.rv1HonoredOnHisLeads) || 0), 0);
        const totalCanceled = rows.reduce((s, r) => s + (Number(r.rv1CanceledOnHisLeads) || 0), 0);
        const qualRate = pct(totalPlanned, totalLeads);
        const honorRate = pct(totalHonored, totalPlanned);
        const cancelRate = pct(totalCanceled, totalPlanned);
        const topByPlanned = [...rows].sort((a, b) => (b.rv1PlannedOnHisLeads || 0) - (a.rv1PlannedOnHisLeads || 0))[0];
        const worstCancel = [...rows]
            .map(r => ({ ...r, cancelRate: pct(r.rv1CanceledOnHisLeads || 0, r.rv1PlannedOnHisLeads || 0) }))
            .sort((a, b) => (b.cancelRate - a.cancelRate))[0];
        return [
            `Sur la période : ${totalLeads} leads, ${totalPlanned} RV1 planifiés, ${totalHonored} honorés.`,
            `Taux de qualification : ${qualRate}%. Taux de présence RV1 : ${honorRate}%. Taux d’annulation RV1 : ${cancelRate}%.`,
            topByPlanned ? `Meilleur volume de RV1 : ${topByPlanned.name} (${topByPlanned.rv1PlannedOnHisLeads || 0}).` : '',
            worstCancel ? `Plus fort taux d’annulation : ${worstCancel.name} (${worstCancel.cancelRate}%).` : '',
            `Recommandations :`,
            `• Renforcer le suivi des leads à faible TTFC (accélérer le 1er contact) ;`,
            `• Analyser les sources des annulations (calendrier, qualification, objections) ;`,
            `• Capitaliser sur les setters à fort volume pour partager scripts et SOP.`,
        ].filter(Boolean).join('\n');
    }
    buildCloserAnalysis(rows) {
        if (!rows?.length)
            return "Aucune donnée disponible sur la période.";
        const totalRv1P = rows.reduce((s, r) => s + (Number(r.rv1Planned) || 0), 0);
        const totalRv1H = rows.reduce((s, r) => s + (Number(r.rv1Honored) || 0), 0);
        const totalSales = rows.reduce((s, r) => s + (Number(r.salesClosed) || 0), 0);
        const totalRv1C = rows.reduce((s, r) => s + (Number(r.rv1Canceled) || 0), 0);
        const closingRate = pct(totalSales, totalRv1H);
        const cancelRate = pct(totalRv1C, totalRv1P);
        const topCloser = [...rows].sort((a, b) => (b.salesClosed || 0) - (a.salesClosed || 0))[0];
        const bestPresence = [...rows]
            .map(r => ({ ...r, presence: pct(r.rv1Honored || 0, r.rv1Planned || 0) }))
            .sort((a, b) => (b.presence - a.presence))[0];
        return [
            `Sur la période : ${totalRv1P} RV1 planifiés, ${totalRv1H} honorés, ${totalSales} ventes.`,
            `Taux de closing global : ${closingRate}%. Taux d’annulation RV1 : ${cancelRate}%.`,
            topCloser ? `Top ventes : ${topCloser.name} (${topCloser.salesClosed} ventes).` : '',
            bestPresence ? `Meilleure présence RV1 : ${bestPresence.name} (${bestPresence.presence}%).` : '',
            `Recommandations :`,
            `• Revoir les no-shows/annulations avec les setters (handoff & reminder) ;`,
            `• Outiller les objections récurrentes (cheatsheets) ;`,
            `• Allouer plus de volume aux closers > closing médian.`,
        ].filter(Boolean).join('\n');
    }
    async exportSpotlightSettersPDF({ from, to }) {
        const rows = await this.spotlightSetters(from, to) || [];
        const totalLeads = rows.reduce((s, r) => s + (Number(r.leadsReceived) || 0), 0);
        const totalP = rows.reduce((s, r) => s + (Number(r.rv1PlannedOnHisLeads) || 0), 0);
        const totalH = rows.reduce((s, r) => s + (Number(r.rv1HonoredOnHisLeads) || 0), 0);
        const totalC = rows.reduce((s, r) => s + (Number(r.rv1CanceledOnHisLeads) || 0), 0);
        const qualRate = pct(totalP, Math.max(1, totalLeads));
        const presence = pct(totalH, Math.max(1, totalP));
        const cancel = pct(totalC, Math.max(1, totalP));
        const topVol = [...rows].sort((a, b) => (b.rv1PlannedOnHisLeads || 0) - (a.rv1PlannedOnHisLeads || 0))[0];
        const worstCancel = [...rows]
            .map(r => ({ ...r, rate: pct(r.rv1CanceledOnHisLeads || 0, Math.max(1, r.rv1PlannedOnHisLeads || 0)) }))
            .sort((a, b) => b.rate - a.rate)[0];
        const analysisIntro = [
            `Sur la période, ${totalLeads} leads enregistrés → ${totalP} RV1 planifiés → ${totalH} honorés.`,
            `KPI globaux : qualification ${qualRate}%, présence RV1 ${presence}%, annulations ${cancel}%.`,
            topVol ? `Plus fort volume : ${topVol.name} (${topVol.rv1PlannedOnHisLeads || 0} RV1 planifiés).` : '',
            worstCancel ? `Annulations les plus élevées : ${worstCancel.name} (${worstCancel.rate}%).` : '',
            `Focus actions : accélérer TTFC, calibrer la promesse amont, partager les scripts des meilleurs setters.`,
        ].filter(Boolean).join(' ');
        const columns = [
            { key: 'name', header: 'Setter', width: 140 },
            { key: 'leadsReceived', header: 'Leads', width: 55, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1PlannedOnHisLeads', header: 'RV1 planifiés', width: 80, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1HonoredOnHisLeads', header: 'RV1 honorés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1CanceledOnHisLeads', header: 'RV1 annulés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1CancelRateOnHisLeads', header: '% annul', width: 55, align: 'right', format: (v) => (v != null ? Math.round(v * 100) : 0) + '%' },
            { key: 'salesFromHisLeads', header: 'Ventes', width: 55, align: 'right', format: (v) => String(v || 0) },
            { key: 'revenueFromHisLeads', header: 'CA (€)', width: 70, align: 'right', format: (v) => Math.round(v || 0).toLocaleString('fr-FR') },
            { key: 'ttfcAvgMinutes', header: 'TTFC (min)', width: 70, align: 'right', format: (v) => v == null ? '—' : String(v) },
            { key: 'settingRate', header: 'T. setting', width: 70, align: 'right', format: (v) => v != null ? Math.round(v * 100) + '%' : '—' },
        ];
        return buildAdvancedPDF({
            title: 'Spotlight Setters',
            period: `Période : ${from || '—'} → ${to || '—'}`,
            columns: columns,
            rows,
            analysisIntro,
            perRowNotes: setterRowNote,
        });
    }
    async exportSpotlightClosersPDF({ from, to }) {
        const rows = await this.spotlightClosers(from, to) || [];
        const totalP = rows.reduce((s, r) => s + (Number(r.rv1Planned) || 0), 0);
        const totalH = rows.reduce((s, r) => s + (Number(r.rv1Honored) || 0), 0);
        const totalSales = rows.reduce((s, r) => s + (Number(r.salesClosed) || 0), 0);
        const totalCancel = rows.reduce((s, r) => s + (Number(r.rv1Canceled) || 0), 0);
        const closing = pct(totalSales, Math.max(1, totalH));
        const cancel = pct(totalCancel, Math.max(1, totalP));
        const topSales = [...rows].sort((a, b) => (b.salesClosed || 0) - (a.salesClosed || 0))[0];
        const bestPresence = [...rows]
            .map(r => ({ ...r, presence: pct(r.rv1Honored || 0, Math.max(1, r.rv1Planned || 0)) }))
            .sort((a, b) => b.presence - a.presence)[0];
        const analysisIntro = [
            `Sur la période : ${totalP} RV1 planifiés → ${totalH} honorés → ${totalSales} ventes.`,
            `KPI globaux : closing ${closing}%, annulations RV1 ${cancel}%.`,
            topSales ? `Top ventes : ${topSales.name} (${topSales.salesClosed} ventes).` : '',
            bestPresence ? `Meilleure présence RV1 : ${bestPresence.name} (${bestPresence.presence}%).` : '',
            `Focus actions : co-résolution des objections récurrentes, re-qualification amont, allocation de volume aux closers > médian.`,
        ].filter(Boolean).join(' ');
        const columns = [
            { key: 'name', header: 'Closer', width: 150 },
            { key: 'rv1Planned', header: 'RV1 planifiés', width: 80, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1Honored', header: 'RV1 honorés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1Canceled', header: 'RV1 annulés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv1CancelRate', header: '% annul RV1', width: 70, align: 'right', format: (v) => v != null ? Math.round(v * 100) + '%' : '—' },
            { key: 'rv2Planned', header: 'RV2 planifiés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv2Honored', header: 'RV2 honorés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv2Canceled', header: 'RV2 annulés', width: 78, align: 'right', format: (v) => String(v || 0) },
            { key: 'rv2CancelRate', header: '% annul RV2', width: 70, align: 'right', format: (v) => v != null ? Math.round(v * 100) + '%' : '—' },
            { key: 'salesClosed', header: 'Ventes', width: 55, align: 'right', format: (v) => String(v || 0) },
            { key: 'revenueTotal', header: 'CA (€)', width: 70, align: 'right', format: (v) => Math.round(v || 0).toLocaleString('fr-FR') },
            { key: 'closingRate', header: 'T. closing', width: 65, align: 'right', format: (v) => v != null ? Math.round(v * 100) + '%' : '—' },
        ];
        return buildAdvancedPDF({
            title: 'Spotlight Closers',
            period: `Période : ${from || '—'} → ${to || '—'}`,
            columns: columns,
            rows,
            analysisIntro,
            perRowNotes: closerRowNote,
        });
    }
    async sumSpend(r) {
        const budgets = await this.prisma.budget.findMany({
            where: { period: client_2.BudgetPeriod.WEEKLY },
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
    async upsertWeeklyBudget(weekStartISO, amount) {
        const weekStart = mondayOfUTC(new Date(weekStartISO));
        return this.prisma.budget.upsert({
            where: {
                period_weekStart: {
                    period: client_2.BudgetPeriod.WEEKLY,
                    weekStart,
                },
            },
            update: { amount },
            create: {
                period: client_2.BudgetPeriod.WEEKLY,
                weekStart,
                amount,
            },
        });
    }
    async listWeeklyBudgets() {
        const rows = await this.prisma.budget.findMany({
            where: { period: client_2.BudgetPeriod.WEEKLY },
            orderBy: { weekStart: 'asc' },
        });
        return rows.map((b) => ({
            id: b.id,
            period: b.period,
            amount: num(b.amount),
            weekStart: b.weekStart ? b.weekStart.toISOString() : null,
            monthStart: b.monthStart ? b.monthStart.toISOString() : null,
            createdAt: b.createdAt.toISOString(),
            updatedAt: b.updatedAt.toISOString(),
        }));
    }
    async weeklyBudgets(from, to) {
        const r = toRange(from, to);
        const budgets = await this.prisma.budget.findMany({
            where: { period: client_2.BudgetPeriod.WEEKLY },
            orderBy: { weekStart: 'asc' },
        });
        const rows = [];
        for (const b of budgets) {
            if (!b.weekStart)
                continue;
            const ws = mondayOfUTC(new Date(b.weekStart));
            const we = sundayOfUTC(new Date(b.weekStart));
            if (r.from && r.to) {
                const intersects = !(ws > r.to || we < r.from);
                if (!intersects)
                    continue;
            }
            rows.push({
                weekStart: ws.toISOString(),
                weekEnd: we.toISOString(),
                amount: num(b.amount),
            });
        }
        rows.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
        return rows;
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
    async ttfcBySetter(from, to) {
        const r = toRange(from, to);
        if (!r.from || !r.to)
            return new Map();
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
    WITH first_req AS (
      SELECT DISTINCT ON (cr."leadId")
             cr."leadId",
             cr."requestedAt"
      FROM "CallRequest" cr
      WHERE cr."requestedAt" >= ${r.from} AND cr."requestedAt" <= ${r.to}
      ORDER BY cr."leadId", cr."requestedAt" ASC
    ),
    first_attempt AS (
      SELECT DISTINCT ON (ca."leadId")
             ca."leadId",
             ca."userId"     AS "setterId",
             ca."startedAt"  AS "attemptAt",
             fr."requestedAt" AS "requestedAt"
      FROM first_req fr
      JOIN "CallAttempt" ca
        ON ca."leadId" = fr."leadId" AND ca."startedAt" >= fr."requestedAt"
      JOIN "User" u
        ON u."id" = ca."userId" AND u."role" = 'SETTER' AND u."isActive" = TRUE
      ORDER BY ca."leadId", ca."startedAt" ASC
    )
    SELECT
      fa."setterId"                           AS "setterId",
      AVG(EXTRACT(EPOCH FROM (fa."attemptAt" - fa."requestedAt")) / 60.0)::numeric(10,2) AS avg,
      COUNT(*)::int                           AS n
    FROM first_attempt fa
    WHERE fa."attemptAt" >= fa."requestedAt"
    GROUP BY fa."setterId"
  `);
        const map = new Map();
        for (const r0 of rows) {
            map.set(r0.setterId, { avg: Number(r0.avg), n: r0.n });
        }
        return map;
    }
    async ttfcBySetterViaStages(from, to, tz = 'Europe/Paris') {
        const r = toRange(from, to);
        if (!r.from || !r.to)
            return new Map();
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
    WITH first_req AS (
      SELECT DISTINCT ON (se."leadId")
             se."leadId",
             se."occurredAt" AS "requestedAt"
      FROM "StageEvent" se
      WHERE se."toStage" = ${client_1.Prisma.sql `'CALL_REQUESTED'::"LeadStage"`}
        AND se."occurredAt" >= ${r.from}
        AND se."occurredAt" <= ${r.to}
        -- 🔥 Filtre heures d'ouverture : 08h <= heure locale < 21h
        AND EXTRACT(HOUR FROM (se."occurredAt" AT TIME ZONE ${tz})) >= 8
        AND EXTRACT(HOUR FROM (se."occurredAt" AT TIME ZONE ${tz})) < 21
      ORDER BY se."leadId", se."occurredAt" ASC
    ),
    first_attempt AS (
      SELECT DISTINCT ON (se."leadId")
             se."leadId",
             se."occurredAt" AS "attemptAt"
      FROM "StageEvent" se
      JOIN first_req fr ON fr."leadId" = se."leadId"
      WHERE se."toStage" = ${client_1.Prisma.sql `'CALL_ATTEMPT'::"LeadStage"`}
        AND se."occurredAt" >= fr."requestedAt"
      ORDER BY se."leadId", se."occurredAt" ASC
    )
    SELECT
      l."setterId" AS "setterId",
      AVG(EXTRACT(EPOCH FROM (fa."attemptAt" - fr."requestedAt")) / 60.0)::numeric(10,2) AS avg,
      COUNT(*)::int AS n
    FROM first_req fr
    JOIN first_attempt fa ON fa."leadId" = fr."leadId"
    JOIN "Lead" l ON l."id" = fr."leadId"
    WHERE fa."attemptAt" >= fr."requestedAt"
      AND l."setterId" IS NOT NULL
    GROUP BY l."setterId"
  `);
        const map = new Map();
        for (const r0 of rows) {
            map.set(r0.setterId, { avg: Number(r0.avg), n: r0.n });
        }
        return map;
    }
    async settersReport(from, to) {
        const r = toRange(from, to);
        const spend = await this.sumSpend(r);
        const setters = await this.prisma.user.findMany({
            where: { role: client_2.Role.SETTER, isActive: true },
            select: { id: true, firstName: true, email: true },
            orderBy: { firstName: 'asc' },
        });
        const allLeads = await this.prisma.lead.findMany({
            where: between('createdAt', r),
            select: { id: true, setterId: true, createdAt: true },
        });
        const totalLeads = allLeads.length;
        const ttfcMap = await this.ttfcBySetterViaStages(from, to);
        const rows = [];
        for (const s of setters) {
            const leads = allLeads.filter((l) => l.setterId === s.id);
            const leadsReceived = leads.length;
            const [rv1PlannedFromHisLeads, rv1CanceledFromHisLeads, rv1NoShowFromHisLeads, rv1FromHisLeads,] = await Promise.all([
                this.countSE({ stages: [client_2.LeadStage.RV1_PLANNED], r, by: { setterId: s.id }, distinctByLead: true }),
                this.countSE({ stages: [client_2.LeadStage.RV1_CANCELED], r, by: { setterId: s.id }, distinctByLead: true }),
                this.countSE({ stages: [client_2.LeadStage.RV1_NO_SHOW], r, by: { setterId: s.id }, distinctByLead: true }),
                this.countSE({ stages: [client_2.LeadStage.RV1_HONORED], r, by: { setterId: s.id }, distinctByLead: true }),
            ]);
            const rv0Count = await this.prisma.appointment.count({
                where: { userId: s.id, type: client_2.AppointmentType.RV0, ...between('scheduledAt', r) },
            });
            const ttfcAgg = ttfcMap.get(s.id);
            const ttfcAvgMinutes = ttfcAgg ? Math.round(ttfcAgg.avg) : null;
            const wonWhere = await this.wonFilter(r);
            wonWhere.setterId = s.id;
            const [wonAgg, salesFromHisLeads] = await Promise.all([
                this.prisma.lead.aggregate({ _sum: { saleValue: true }, where: wonWhere }),
                this.prisma.lead.count({ where: wonWhere }),
            ]);
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
                salesFromHisLeads: num(salesFromHisLeads),
                spendShare: Number(spendShare.toFixed(2)),
                cpl,
                cpRv0,
                cpRv1,
                roas,
                rv1PlannedFromHisLeads: num(rv1PlannedFromHisLeads),
                rv1CanceledFromHisLeads: num(rv1CanceledFromHisLeads),
                rv1NoShowFromHisLeads: num(rv1NoShowFromHisLeads),
            });
        }
        return rows;
    }
    async perDayFromStageEvents(toStages, from, to, tz = 'Europe/Paris') {
        const r = toRange(from, to);
        const stageEnums = toStages.map(s => s);
        if (!r.from || !r.to) {
            const total = await this.prisma.stageEvent.count({ where: { toStage: { in: stageEnums } } });
            return { total: num(total), byDay: [] };
        }
        const stageList = client_1.Prisma.join(stageEnums.map(s => client_1.Prisma.sql `${s}::"LeadStage"`));
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT
        to_char(DATE_TRUNC('day', (se."occurredAt" AT TIME ZONE ${tz})), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM "StageEvent" se
      WHERE se."toStage" = ANY(ARRAY[${stageList}]::"LeadStage"[])
        AND ${whereLocalDay('occurredAt', from, to, tz)}
      GROUP BY 1
      ORDER BY 1 ASC
    `);
        const map = new Map(rows.map(r0 => [r0.day, num(r0.count)]));
        const byDay = daysSpanLocal(from, to).map(d => ({ day: d, count: map.get(d) ?? 0 }));
        const total = byDay.reduce((s, r0) => s + r0.count, 0);
        return { total, byDay };
    }
    async stageSeries(stage, from, to, tz = 'Europe/Paris') {
        return this.perDayFromStageEvents([stage], from, to, tz);
    }
    async canceledDaily(from, to, tz = 'Europe/Paris') {
        if (!from || !to) {
            const total = await this.prisma.stageEvent.count({
                where: {
                    toStage: {
                        in: [
                            'RV1_CANCELED',
                            'RV1_POSTPONED',
                            'RV2_CANCELED',
                            'RV2_POSTPONED',
                        ],
                    },
                },
            });
            return {
                total: num(total),
                byDay: [],
            };
        }
        const [rv1Canceled, rv1Postponed, rv2Canceled, rv2Postponed] = await Promise.all([
            this.perDayFromStageEvents([client_2.LeadStage.RV1_CANCELED], from, to, tz),
            this.perDayFromStageEvents(['RV1_POSTPONED'], from, to, tz),
            this.perDayFromStageEvents([client_2.LeadStage.RV2_CANCELED], from, to, tz),
            this.perDayFromStageEvents(['RV2_POSTPONED'], from, to, tz),
        ]);
        const map = new Map();
        const addSeries = (src, key) => {
            const arr = src?.byDay ?? [];
            for (const row of arr) {
                if (!row?.day)
                    continue;
                const dayKey = row.day.length >= 10
                    ? row.day.slice(0, 10)
                    : new Date(row.day).toISOString().slice(0, 10);
                const bucket = map.get(dayKey) ?? { rv1: 0, rv2: 0 };
                bucket[key] += num(row.count || 0);
                map.set(dayKey, bucket);
            }
        };
        addSeries(rv1Canceled, 'rv1');
        addSeries(rv1Postponed, 'rv1');
        addSeries(rv2Canceled, 'rv2');
        addSeries(rv2Postponed, 'rv2');
        const byDay = [];
        for (const day of daysSpanLocal(from, to)) {
            const bucket = map.get(day) ?? { rv1: 0, rv2: 0 };
            const rv1CanceledPostponed = num(bucket.rv1);
            const rv2CanceledPostponed = num(bucket.rv2);
            byDay.push({
                day,
                rv1CanceledPostponed,
                rv2CanceledPostponed,
                total: rv1CanceledPostponed + rv2CanceledPostponed,
            });
        }
        const total = byDay.reduce((s, r) => s + num(r.total), 0);
        return { total, byDay };
    }
    async closersReport(from, to) {
        const r = toRange(from, to);
        const closers = await this.prisma.user.findMany({
            where: { role: client_2.Role.CLOSER, isActive: true },
            select: { id: true, firstName: true, email: true },
            orderBy: { firstName: 'asc' },
        });
        const spend = await this.sumSpend(r);
        const rows = [];
        for (const c of closers) {
            const [rv1Planned, rv1HonoredCount, rv1NoShow, rv1Canceled, rv1Postponed, rv1NotQualified, rv2Planned, rv2Honored, rv2NoShow, rv2Canceled, rv2Postponed, contractsSigned,] = await Promise.all([
                this.countSE({ stages: [client_2.LeadStage.RV1_PLANNED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV1_HONORED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV1_NO_SHOW], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV1_CANCELED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV1_POSTPONED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV1_NOT_QUALIFIED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV2_PLANNED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV2_HONORED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV2_NO_SHOW], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV2_CANCELED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.RV2_POSTPONED], r, by: { closerId: c.id } }),
                this.countSE({ stages: [client_2.LeadStage.CONTRACT_SIGNED], r, by: { closerId: c.id } }),
            ]);
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
            const roasHonored = rv1HonoredCount
                ? Number(((revenueTotal || 0) / (spend || 1) / rv1HonoredCount).toFixed(2))
                : null;
            const rv1CancelRate = rv1Planned ? Number((rv1Canceled / rv1Planned).toFixed(4)) : null;
            const rv2CancelRate = rv2Planned ? Number((rv2Canceled / rv2Planned).toFixed(4)) : null;
            const rv1NoShowRate = rv1Planned ? Number((rv1NoShow / rv1Planned).toFixed(4)) : null;
            const rv2NoShowRate = rv2Planned ? Number((rv2NoShow / rv2Planned).toFixed(4)) : null;
            rows.push({
                userId: c.id,
                name: c.firstName,
                email: c.email,
                rv1Planned: num(rv1Planned),
                rv1Honored: num(rv1HonoredCount),
                rv1NoShow: num(rv1NoShow),
                rv1Canceled: num(rv1Canceled),
                rv1Postponed: num(rv1Postponed),
                rv1NotQualified: num(rv1NotQualified),
                rv2Planned: num(rv2Planned),
                rv2Honored: num(rv2Honored),
                rv2NoShow: num(rv2NoShow),
                rv2Canceled: num(rv2Canceled),
                rv2Postponed: num(rv2Postponed),
                contractsSigned: num(contractsSigned),
                salesClosed: num(salesClosed),
                revenueTotal,
                roasPlanned,
                roasHonored,
                rv1CancelRate,
                rv1NoShowRate,
                rv2CancelRate,
                rv2NoShowRate,
            });
        }
        rows.sort((a, b) => b.revenueTotal - a.revenueTotal ||
            b.salesClosed - a.salesClosed);
        return rows;
    }
    async spotlightSetters(from, to) {
        const base = await this.settersReport(from, to);
        const rows = base.map((r) => {
            const rv1CancelRate = r.rv1PlannedFromHisLeads
                ? Number((r.rv1CanceledFromHisLeads / r.rv1PlannedFromHisLeads).toFixed(4))
                : null;
            const rv1NoShowRate = r.rv1PlannedFromHisLeads
                ? Number((r.rv1NoShowFromHisLeads / r.rv1PlannedFromHisLeads).toFixed(4))
                : null;
            const settingRate = r.leadsReceived
                ? Number((r.rv1PlannedFromHisLeads / r.leadsReceived).toFixed(4))
                : null;
            return {
                userId: r.userId,
                name: r.name,
                email: r.email,
                rv1PlannedOnHisLeads: r.rv1PlannedFromHisLeads,
                rv1DoneOnHisLeads: r.rv1FromHisLeads,
                rv1CanceledOnHisLeads: r.rv1CanceledFromHisLeads,
                rv1NoShowOnHisLeads: r.rv1NoShowFromHisLeads,
                rv1CancelRate,
                rv1NoShowRate,
                salesFromHisLeads: r.salesFromHisLeads,
                revenueFromHisLeads: r.revenueFromHisLeads,
                settingRate,
                leadsReceived: r.leadsReceived,
                ttfcAvgMinutes: r.ttfcAvgMinutes,
            };
        });
        rows.sort((a, b) => b.revenueFromHisLeads - a.revenueFromHisLeads ||
            b.rv1PlannedOnHisLeads - a.rv1PlannedOnHisLeads);
        return rows;
    }
    async spotlightClosers(from, to) {
        const base = await this.closersReport(from, to);
        const rows = base.map((r) => {
            const closingRate = r.rv1Honored ? Number((r.salesClosed / r.rv1Honored).toFixed(4)) : null;
            return {
                userId: r.userId,
                name: r.name,
                email: r.email,
                rv1Planned: r.rv1Planned,
                rv1Honored: r.rv1Honored,
                rv1NoShow: r.rv1NoShow,
                rv1Canceled: r.rv1Canceled,
                rv1Postponed: r.rv1Postponed,
                rv1NotQualified: r.rv1NotQualified,
                rv1CancelRate: r.rv1CancelRate,
                rv1NoShowRate: r.rv1NoShowRate ?? null,
                rv2Planned: r.rv2Planned,
                rv2Honored: r.rv2Honored,
                rv2NoShow: r.rv2NoShow,
                rv2Canceled: r.rv2Canceled,
                rv2Postponed: r.rv2Postponed,
                rv2CancelRate: r.rv2CancelRate,
                rv2NoShowRate: r.rv2NoShowRate ?? null,
                contractsSigned: r.contractsSigned,
                salesClosed: r.salesClosed,
                revenueTotal: r.revenueTotal,
                closingRate,
            };
        });
        rows.sort((a, b) => b.revenueTotal - a.revenueTotal ||
            b.salesClosed - a.salesClosed);
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
                    type: client_2.AppointmentType.RV1,
                    leadId: { in: duo.leadIds },
                },
            });
            const rv1Honored = await this.prisma.appointment.count({
                where: {
                    type: client_2.AppointmentType.RV1,
                    leadId: { in: duo.leadIds },
                    status: client_2.AppointmentStatus.HONORED,
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
        const [leadsCreated, callReq, calls, answered, setterNoShow, rv0P, rv0H, rv0NS, rv0C, rv0NotQ, rv1P, rv1H, rv1NS, rv1C, rv1NotQ, rv1Post, rv2P, rv2H, rv2NS, rv2C, rv2Post, followUpSetter, followUpCloser, notQual, lost, wonCount, appointmentCanceled,] = await Promise.all([
            this.prisma.lead.count({ where: between('createdAt', r) }),
            get(['CALL_REQUESTED']),
            get(['CALL_ATTEMPT']),
            get(['CALL_ANSWERED']),
            get(['SETTER_NO_SHOW']),
            get(['RV0_PLANNED']),
            get(['RV0_HONORED']),
            get(['RV0_NO_SHOW']),
            get(['RV0_CANCELED']),
            get(['RV0_NOT_QUALIFIED']),
            get(['RV1_PLANNED']),
            get(['RV1_HONORED']),
            get(['RV1_NO_SHOW']),
            get(['RV1_CANCELED']),
            get(['RV1_NOT_QUALIFIED']),
            get(['RV1_POSTPONED']),
            get(['RV2_PLANNED']),
            get(['RV2_HONORED']),
            get(['RV2_NO_SHOW']),
            get(['RV2_CANCELED']),
            get(['RV2_POSTPONED']),
            get(['FOLLOW_UP']),
            get(['FOLLOW_UP_CLOSER']),
            get(['NOT_QUALIFIED']),
            get(['LOST']),
            (async () => {
                const where = await this.wonFilter(r);
                return this.prisma.lead.count({ where });
            })(),
            this.prisma.appointment.count({
                where: { status: client_2.AppointmentStatus.CANCELED, ...between('scheduledAt', r) },
            }),
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
            rv0Canceled: num(rv0C),
            rv1Planned: num(rv1P),
            rv1Honored: num(rv1H),
            rv1NoShow: num(rv1NS),
            rv1Canceled: num(rv1C),
            rv1Postponed: num(rv1Post),
            rv2Planned: num(rv2P),
            rv2Honored: num(rv2H),
            rv2NoShow: num(rv2NS),
            rv2Canceled: num(rv2C),
            rv2Postponed: num(rv2Post),
            rv0NotQualified: num(rv0NotQ),
            rv1NotQualified: num(rv1NotQ),
            followUpSetter: num(followUpSetter),
            followUpCloser: num(followUpCloser),
            notQualified: num(notQual),
            lost: num(lost),
            wonCount: num(wonCount),
            appointmentCanceled: num(appointmentCanceled),
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
                rv2NoShow: await this.countEnteredInStages(['RV2_NO_SHOW'], wRange),
                rv2Postponed: await this.countEnteredInStages(['RV2_POSTPONED'], wRange),
                notQualified: await this.countEnteredInStages(['NOT_QUALIFIED'], wRange),
                lost: await this.countEnteredInStages(['LOST'], wRange),
            };
            out.push(row);
        }
        return out;
    }
    async perDayFromStages(keys, from, to, tz = 'Europe/Paris') {
        const ids = await this.stageIdsForKeys(keys);
        if (!from || !to) {
            const where = { OR: [{ stage: { in: keys } }, ...(ids.length ? [{ stageId: { in: ids } }] : [])] };
            const total = await this.prisma.lead.count({ where });
            return { total: num(total), byDay: [] };
        }
        const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `
    SELECT
      to_char(DATE_TRUNC('day', (l."stageUpdatedAt" AT TIME ZONE ${tz})), 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count
    FROM "Lead" l
    WHERE ( ${client_1.Prisma.join([
            client_1.Prisma.sql `l."stage" = ANY(${client_1.Prisma.sql `ARRAY[${client_1.Prisma.join(keys.map(k => client_1.Prisma.sql `${k}::"LeadStage"`))}]::"LeadStage"[]`})`,
            ...(ids.length ? [client_1.Prisma.sql `l."stageId" = ANY(${client_1.Prisma.sql `ARRAY[${client_1.Prisma.join(ids)}]`})`] : []),
        ], ' OR ')} )
      AND ${whereLocalDay('stageUpdatedAt', from, to, tz)}
    GROUP BY 1
    ORDER BY 1 ASC
  `);
        const map = new Map(rows.map(r0 => [r0.day, num(r0.count)]));
        const byDay = daysSpanLocal(from, to).map(d => ({ day: d, count: map.get(d) ?? 0 }));
        const total = byDay.reduce((s, r0) => s + r0.count, 0);
        return { total, byDay };
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
    async metricCallsCanceled0(f, t, tz = 'Europe/Paris') {
        return this.perDayFromStageEvents([client_2.LeadStage.RV0_CANCELED], f, t, tz);
    }
    async metricCallsCanceled1(f, t, tz = 'Europe/Paris') {
        return this.perDayFromStageEvents([client_2.LeadStage.RV1_CANCELED], f, t, tz);
    }
    async metricCallsCanceled2(f, t, tz = 'Europe/Paris') {
        return this.perDayFromStageEvents([client_2.LeadStage.RV2_CANCELED], f, t, tz);
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
        const { from, to, type, status, userId } = args;
        const limit = args.limit ?? 2000;
        const r = toRange(from, to);
        const stages = [];
        const push = (s) => {
            if (!stages.includes(s))
                stages.push(s);
        };
        if (type === 'RV0') {
            if (!status || status === 'PLANNED')
                push(client_2.LeadStage.RV0_PLANNED);
            if (!status || status === 'HONORED')
                push(client_2.LeadStage.RV0_HONORED);
            if (!status || status === 'NO_SHOW')
                push(client_2.LeadStage.RV0_NO_SHOW);
            if (!status || status === 'CANCELED')
                push(client_2.LeadStage.RV0_CANCELED);
        }
        else if (type === 'RV1') {
            if (!status || status === 'PLANNED')
                push(client_2.LeadStage.RV1_PLANNED);
            if (!status || status === 'HONORED')
                push(client_2.LeadStage.RV1_HONORED);
            if (!status || status === 'NO_SHOW')
                push(client_2.LeadStage.RV1_NO_SHOW);
            if (!status || status === 'CANCELED')
                push(client_2.LeadStage.RV1_CANCELED);
        }
        else if (type === 'RV2') {
            if (!status || status === 'PLANNED')
                push(client_2.LeadStage.RV2_PLANNED);
            if (!status || status === 'HONORED')
                push(client_2.LeadStage.RV2_HONORED);
            if (!status || status === 'NO_SHOW')
                push(client_2.LeadStage.RV2_NO_SHOW);
            if (!status || status === 'CANCELED')
                push(client_2.LeadStage.RV2_CANCELED);
            if (status === 'POSTPONED')
                push(client_2.LeadStage.RV2_POSTPONED);
        }
        if (!type && status === 'NOT_QUALIFIED') {
            push(client_2.LeadStage.NOT_QUALIFIED);
        }
        if (!stages.length) {
            return { ok: true, count: 0, items: [] };
        }
        const where = {
            toStage: { in: stages },
            ...between('occurredAt', r),
        };
        if (userId) {
            const leadFilter = {};
            if (type === 'RV0') {
                leadFilter.setterId = userId;
            }
            else if (type === 'RV1' || type === 'RV2') {
                leadFilter.closerId = userId;
            }
            if (Object.keys(leadFilter).length) {
                where.lead = { ...where.lead, ...leadFilter };
            }
            else {
                where.userId = userId;
            }
        }
        const rows = await this.prisma.stageEvent.findMany({
            where,
            orderBy: { occurredAt: 'desc' },
            take: limit,
            select: {
                occurredAt: true,
                toStage: true,
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
        const statusFromStage = (s) => {
            switch (s) {
                case client_2.LeadStage.RV0_PLANNED:
                case client_2.LeadStage.RV1_PLANNED:
                case client_2.LeadStage.RV2_PLANNED:
                    return 'PLANNED';
                case client_2.LeadStage.RV0_HONORED:
                case client_2.LeadStage.RV1_HONORED:
                case client_2.LeadStage.RV2_HONORED:
                    return 'HONORED';
                case client_2.LeadStage.RV0_NO_SHOW:
                case client_2.LeadStage.RV1_NO_SHOW:
                case client_2.LeadStage.RV2_NO_SHOW:
                    return 'NO_SHOW';
                case client_2.LeadStage.RV0_CANCELED:
                case client_2.LeadStage.RV1_CANCELED:
                case client_2.LeadStage.RV2_CANCELED:
                    return 'CANCELED';
                case client_2.LeadStage.NOT_QUALIFIED:
                    return 'NOT_QUALIFIED';
                default:
                    return 'UNKNOWN';
            }
        };
        const typeFromStage = (s) => {
            const v = String(s);
            if (v.startsWith('RV0_'))
                return 'RV0';
            if (v.startsWith('RV1_'))
                return 'RV1';
            if (v.startsWith('RV2_'))
                return 'RV2';
            return 'PIPELINE';
        };
        const items = rows
            .filter((r0) => !!r0.lead)
            .map((r0) => {
            const L = r0.lead;
            const inferredStatus = statusFromStage(r0.toStage);
            const inferredType = typeFromStage(r0.toStage);
            const appStatus = status ?? inferredStatus;
            const appType = type ?? inferredType;
            return {
                leadId: L.id,
                leadName: [L.firstName, L.lastName].filter(Boolean).join(' ') || '—',
                email: L.email,
                phone: L.phone,
                setter: L.setter
                    ? { id: L.setter.id, name: L.setter.firstName, email: L.setter.email }
                    : null,
                closer: L.closer
                    ? { id: L.closer.id, name: L.closer.firstName, email: L.closer.email }
                    : null,
                appointment: {
                    type: appType,
                    status: appStatus,
                    scheduledAt: r0.occurredAt.toISOString(),
                },
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
                where: { outcome: client_2.CallOutcome.ANSWERED, ...between('startedAt', r) },
                orderBy: { startedAt: 'asc' },
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
                where: { stage: client_2.LeadStage.SETTER_NO_SHOW, ...between('stageUpdatedAt', r) },
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