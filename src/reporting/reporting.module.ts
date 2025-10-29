import { Module } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  providers: [ReportingService],
  controllers: [ReportingController],
  exports: [ReportingService],   // ✅ rendre visible pour les autres modules
})
export class ReportingModule {}
