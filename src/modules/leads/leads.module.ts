// src/modules/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StageEventsService } from './stage-events.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [PrismaModule],
  providers: [LeadsService, StageEventsService],
  exports: [LeadsService, StageEventsService],
})
export class LeadsModule {}
