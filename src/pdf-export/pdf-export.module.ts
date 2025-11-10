import { Module } from '@nestjs/common';
import { PdfExportController } from './pdf-export.controller';
import { PdfExportService } from './pdf-export.service';
import { ReportingModule } from '../reporting/reporting.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ReportingModule, // fournit ReportingService utilisé par PdfExportService
    AuthModule,      // fournit JwtAuthGuard / JwtStrategy
  ],
  controllers: [PdfExportController],
  providers: [PdfExportService],
  exports: [PdfExportService],
})
  
export class PdfExportModule {}
