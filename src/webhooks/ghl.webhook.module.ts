import { Module } from '@nestjs/common';
import { GhlWebhookController } from './ghl.webhook.controller';
import { GhlWebhookService } from './ghl.webhook.service';

@Module({
  controllers: [GhlWebhookController],
  providers: [GhlWebhookService],
})
  
export class GhlWebhookModule {}
