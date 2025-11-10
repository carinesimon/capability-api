import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from '../reporting/reporting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StageEventsService } from '../modules/leads/stage-events.service';

@Module({
    imports: [
    PrismaModule,   // si non-global
  ],
  controllers: [ProspectsController],
  providers: [
    ProspectsService,
    PrismaService,
    // NEW: injecté pour que ProspectsService puisse lire reporting.funnel()
   // ReportingService,
    StageEventsService
  ],
  exports: [ProspectsService],
})
    
export class ProspectsModule {}
