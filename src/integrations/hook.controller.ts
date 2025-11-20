import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller()
export class HookController {
  constructor(private readonly svc: IntegrationsService) {}

  @Post('hook/:routeKey')
  async receiveHook(
    @Param('routeKey') routeKey: string,
    @Req() req: any,
    @Headers() headers: Record<string, any>,
  ) {
    // pas de signature HMAC → JSON direct
    const contentType = (headers['content-type'] || headers['Content-Type'] || 'application/json') as string;
    // req.body est déjà parsé par express.json()
    const payload = req.body ?? {};

    const ev = await this.svc.receiveWebhook(routeKey, contentType, payload);
    return { ok: true, eventId: ev.id };
  }
  
}

