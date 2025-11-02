// src/modules/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadsService } from './leads.service';
import { StageEventsService } from './stage-events.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController],
  providers: [LeadsService, StageEventsService],
  exports: [
    LeadsService,
    StageEventsService, // 👈 on l’exporte pour que les autres modules puissent l’injecter
  ],
})
export class LeadsModule {}
