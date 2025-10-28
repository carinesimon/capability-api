import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from '../reporting/reporting.service';
import { StageEventsService } from '../modules/leads/stage-events.service';
import { LeadsModule } from '../modules/leads/leads.module'; 
import { PrismaModule } from '../prisma/prisma.module';
import { ProspectsCompatController } from './prospects-compat.controller';

@Module({
    imports: [
    PrismaModule,   // si non-global
    LeadsModule,    // <-- rend LeadStageService injectable ici
  ],
  controllers: [ProspectsController, ProspectsCompatController],
  providers: [
    ProspectsService,
    PrismaService,
    // NEW: injecté pour que ProspectsService puisse lire reporting.funnel()
    ReportingService,
    LeadsModule,
  ],
  exports: [ProspectsService],
})
export class ProspectsModule {}
