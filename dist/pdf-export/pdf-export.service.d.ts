import { ReportingService } from '../reporting/reporting.service';
import { Buffer } from 'node:buffer';
export declare class PdfExportService {
    private reporting;
    private readonly logger;
    constructor(reporting: ReportingService);
    private ensureDir;
    private buildSettersHtml;
    private buildClosersHtml;
    htmlToPdfBuffer(html: string): Promise<Buffer>;
    exportSettersHtml(from?: string, to?: string): Promise<string>;
    exportSettersPdf(from?: string, to?: string): Promise<Buffer>;
    exportAndArchiveSetters(from?: string, to?: string): Promise<{
        pdf: Buffer;
        filepath: string;
    }>;
    exportClosersHtml(from?: string, to?: string): Promise<string>;
    exportClosersPdf(from?: string, to?: string): Promise<Buffer>;
    exportAndArchiveClosers(from?: string, to?: string): Promise<{
        pdf: Buffer;
        filepath: string;
    }>;
}
