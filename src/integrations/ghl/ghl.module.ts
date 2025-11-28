import { Module } from '@nestjs/common';
import { GhlController } from './ghl.controller';
import { GhlService } from './ghl.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadsModule } from '../../modules/leads/leads.module';
@Module({
    imports: [
    PrismaModule,
    LeadsModule, // 👈 pour injecter StageEventsService dans GhlService
  ],
  controllers: [GhlController],
  providers: [GhlService, PrismaService],
})
export class GhlModule {}
