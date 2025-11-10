// src/webhooks/ghl.webhook.controller.ts
import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { GhlWebhookService } from './ghl.webhook.service';

@Controller('webhooks/ghl')
export class GhlWebhookController {
  constructor(private readonly svc: GhlWebhookService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: any,
    @Headers('x-ghl-signature') signature?: string, // si tu actives la signature
  ) {
    // 1) Optionnel: vérifier HMAC
    // await this.svc.verifySignature(req.rawBody ?? req.body, signature);

    // 2) Parse (GHL envoie souvent du JSON avec des champs "event" / "type" et "data")
    // Comme on a raw, assure-toi que main.ts fait aussi app.use(express.json()) juste après (c’est déjà le cas).
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Exemple structures possibles (adapte selon ton mapping exact côté GHL):
    // - payload.event === "contact.created" || "contact.updated" -> payload.contact
    // - payload.event === "opportunity.stage.changed" -> payload.opportunity
    // - payload.event === "appointment.*" -> payload.appointment

    const ev = (payload?.event || payload?.type || '').toString().toLowerCase();

    if (ev.includes('contact')) {
      await this.svc.handleContact(payload);
    } else if (ev.includes('opportunity')) {
      await this.svc.handleOpportunity(payload);
    } else if (ev.includes('appointment')) {
      await this.svc.handleAppointment(payload);
    } else if (ev.includes('call')) {
      await this.svc.handleCall(payload);
    }

    return { ok: true };
  }
}
