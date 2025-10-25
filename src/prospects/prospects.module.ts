import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from '../reporting/reporting.service';

@Module({
  controllers: [ProspectsController],
  providers: [
    ProspectsService,
    PrismaService,
    // NEW: injecté pour que ProspectsService puisse lire reporting.funnel()
    ReportingService,
  ],
  exports: [ProspectsService],
})
export class ProspectsModule {}
