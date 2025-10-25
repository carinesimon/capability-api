import { Module } from '@nestjs/common';
import { GhlController } from './ghl.controller';
import { GhlService } from './ghl.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [GhlController],
  providers: [GhlService, PrismaService],
})
export class GhlModule {}
