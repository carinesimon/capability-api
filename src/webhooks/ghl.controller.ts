import { Controller, Headers, Post, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class GhlController {
  constructor(private readonly service: WebhooksService) {}

  @Post('ghl')
  async handle(@Req() req: any, @Headers() headers: Record<string, any>) {
    // Grâce au raw parser dans main.ts, req.body est un Buffer ici
    const rawBody: string =
      Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : (req.rawBody?.toString?.() ?? JSON.stringify(req.body));
    const parsed = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;
    return this.service.handleGhlWebhook(rawBody, headers, parsed);
  }
  
}
