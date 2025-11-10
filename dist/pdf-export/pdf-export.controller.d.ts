import type { Response } from 'express';
import { PdfExportService } from './pdf-export.service';
export declare class PdfExportController {
    private readonly service;
    constructor(service: PdfExportService);
    setters(from: string | undefined, to: string | undefined, archive: string | undefined, format: string | undefined, res: Response): Promise<Response<any, Record<string, any>>>;
    closers(from: string | undefined, to: string | undefined, archive: string | undefined, format: string | undefined, res: Response): Promise<Response<any, Record<string, any>>>;
}
