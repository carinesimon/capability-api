import type { Response } from 'express';
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { PdfExportService } from './pdf-export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pdf-export')
@UseGuards(JwtAuthGuard)
export class PdfExportController {
  constructor(private readonly service: PdfExportService) {}

  @Get('setters')
  async setters(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('archive') archive: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if (format === 'html') {
      const html = await this.service.exportSettersHtml(from, to);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (archive === 'true') {
      const { pdf, filepath } = await this.service.exportAndArchiveSetters(from, to);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="setters_report.pdf"');
      res.setHeader('X-Archived-Path', filepath);
      return res.send(pdf);
    }

    const pdf = await this.service.exportSettersPdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="setters_report.pdf"');
    return res.send(pdf);
  }

  @Get('closers')
  async closers(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('archive') archive: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if (format === 'html') {
      const html = await this.service.exportClosersHtml(from, to);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (archive === 'true') {
      const { pdf, filepath } = await this.service.exportAndArchiveClosers(from, to);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="closers_report.pdf"');
      res.setHeader('X-Archived-Path', filepath);
      return res.send(pdf);
    }

    const pdf = await this.service.exportClosersPdf(from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="closers_report.pdf"');
    return res.send(pdf);
  }
}
