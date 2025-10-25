import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { HookController } from './hook.controller';
import { AutoAssignService } from './auto-assign.service';

@Module({
  imports: [PrismaModule],
  providers: [IntegrationsService, AutoAssignService],
  controllers: [IntegrationsController, HookController],
  exports: [IntegrationsService, AutoAssignService],
})
export class IntegrationsModule {}
