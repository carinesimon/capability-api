import { Module } from '@nestjs/common';
import { GhlController } from './ghl.controller';
import { WebhooksService } from './webhooks.service';
import { AttributionModule } from '../attribution/attribution.module';

@Module({
  imports: [AttributionModule],
  controllers: [GhlController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
