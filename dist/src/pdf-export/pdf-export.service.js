"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportService = void 0;
const common_1 = require("@nestjs/common");
const reporting_service_1 = require("../reporting/reporting.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const node_buffer_1 = require("node:buffer");
function fmt(n) {
    if (n === null || n === undefined)
        return '-';
    return typeof n === 'number' ? n.toString() : String(n);
}
let PdfExportService = PdfExportService_1 = class PdfExportService {
    reporting;
    logger = new common_1.Logger(PdfExportService_1.name);
    constructor(reporting) {
        this.reporting = reporting;
    }
    ensureDir(p) {
        if (!fs.existsSync(p))
            fs.mkdirSync(p, { recursive: true });
    }
    buildSettersHtml(title, rows, from, to) {
        const period = [from, to].filter(Boolean).join(' → ');
        const tableRows = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.leadsReceived}</td>
        <td>${r.rv0Count}</td>
        <td>${r.rv1FromHisLeads}</td>
        <td>${fmt(r.ttfcAvgMinutes)}</td>
        <td>${fmt(r.revenueFromHisLeads)}</td>
        <td>${fmt(r.cpl)}</td>
        <td>${fmt(r.cpRv0)}</td>
        <td>${fmt(r.cpRv1)}</td>
        <td>${fmt(r.roas)}</td>
      </tr>
    `).join('');
        return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; }
    h1 { margin: 0 0 4px 0; font-size: 20px; }
    .muted { color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="muted">Période : ${period || '—'}</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Setter</th>
        <th>Email</th>
        <th>Leads reçus</th>
        <th>RV0</th>
        <th>RV1 (sur ses leads)</th>
        <th>TTFC (min)</th>
        <th>CA via ses leads</th>
        <th>CPL</th>
        <th>CP-RV0</th>
        <th>CP-RV1</th>
        <th>ROAS</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="12">Aucune donnée</td></tr>'}</tbody>
  </table>
</body>
</html>`;
    }
    buildClosersHtml(title, rows, from, to) {
        const period = [from, to].filter(Boolean).join(' → ');
        const tableRows = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.rv1Planned}</td>
        <td>${r.rv1Honored}</td>
        <td>${r.rv1NoShow}</td>
        <td>${r.rv2Planned}</td>
        <td>${r.rv2Honored}</td>
        <td>${r.salesClosed}</td>
        <td>${fmt(r.revenueTotal)}</td>
        <td>${fmt(r.rosPlanned)}</td>
        <td>${fmt(r.rosHonored)}</td>
      </tr>
    `).join('');
        return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; }
    h1 { margin: 0 0 4px 0; font-size: 20px; }
    .muted { color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="muted">Période : ${period || '—'}</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Closer</th>
        <th>Email</th>
        <th>RV1 planifiés</th>
        <th>RV1 honorés</th>
        <th>RV1 no-show</th>
        <th>RV2 planifiés</th>
        <th>RV2 honorés</th>
        <th>Ventes</th>
        <th>CA</th>
        <th>ROS (planifiés)</th>
        <th>ROS (honorés)</th>
      </tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="12">Aucune donnée</td></tr>'}</tbody>
  </table>
</body>
</html>`;
    }
    async htmlToPdfBuffer(html) {
        try {
            const resolvedPath = process.env.PUPPETEER_EXECUTABLE_PATH
                ?? (typeof puppeteer_1.default.executablePath === 'function'
                    ? puppeteer_1.default.executablePath()
                    : undefined);
            this.logger.log(`Puppeteer executable: ${resolvedPath ?? 'DEFAULT (none)'}`);
            const browser = await puppeteer_1.default.launch({
                executablePath: resolvedPath,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfData = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
            });
            await browser.close();
            return node_buffer_1.Buffer.from(pdfData);
        }
        catch (err) {
            this.logger.error(`Puppeteer PDF error: ${err?.message || err}`);
            throw err;
        }
    }
    async exportSettersHtml(from, to) {
        const rows = await this.reporting.settersReport(from, to);
        return this.buildSettersHtml('Bilan Setters', rows, from, to);
    }
    async exportSettersPdf(from, to) {
        const html = await this.exportSettersHtml(from, to);
        return this.htmlToPdfBuffer(html);
    }
    async exportAndArchiveSetters(from, to) {
        const pdf = await this.exportSettersPdf(from, to);
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const baseDir = path.resolve(process.cwd(), 'storage', 'reports', 'setters', ym);
        this.ensureDir(baseDir);
        const filepath = path.join(baseDir, `report_setters_${ts}.pdf`);
        fs.writeFileSync(filepath, pdf);
        return { pdf, filepath };
    }
    async exportClosersHtml(from, to) {
        const rows = await this.reporting.closersReport(from, to);
        return this.buildClosersHtml('Bilan Closers', rows, from, to);
    }
    async exportClosersPdf(from, to) {
        const html = await this.exportClosersHtml(from, to);
        return this.htmlToPdfBuffer(html);
    }
    async exportAndArchiveClosers(from, to) {
        const pdf = await this.exportClosersPdf(from, to);
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const baseDir = path.resolve(process.cwd(), 'storage', 'reports', 'closers', ym);
        this.ensureDir(baseDir);
        const filepath = path.join(baseDir, `report_closers_${ts}.pdf`);
        fs.writeFileSync(filepath, pdf);
        return { pdf, filepath };
    }
};
exports.PdfExportService = PdfExportService;
exports.PdfExportService = PdfExportService = PdfExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], PdfExportService);
//# sourceMappingURL=pdf-export.service.js.map