// src/integrations/ghl/ghl.controller.ts
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { GhlService } from './ghl.service';

type GhlWebhookBody = {
  eventId?: string;
  type?: string; // 'contact.created' | 'appointment.created' | 'opportunity.updated' ...
  payload?: any;
};

@Controller('integrations/ghl')
export class GhlController {
  constructor(private readonly ghl: GhlService) {}

  /**
   * Endpoint unique pour les webhooks GHL.
   * On déduplique par eventId, puis on route selon "type".
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() body: GhlWebhookBody) {
    const eventId = body?.eventId ?? body?.payload?.eventId ?? body?.payload?.id;
    const type = (body?.type || body?.payload?.type || '').toString().toLowerCase();
    const payload = body?.payload || body;

    // idempotence
    await this.ghl.deduplicate(eventId);

    if (type.startsWith('contact')) {
      await this.ghl.upsertContact({
        firstName: payload?.firstName ?? payload?.contact?.firstName,
        lastName: payload?.lastName ?? payload?.contact?.lastName,
        email: payload?.email ?? payload?.contact?.email,
        phone: payload?.phone ?? payload?.contact?.phone,
        tag: payload?.tag ?? payload?.source,
        ghlContactId: payload?.id ?? payload?.contactId ?? payload?.contact?.id,
        sourceTag: payload?.source,
      });
      return { ok: true, handled: 'contact' };
    }

    if (type.includes('opportunity')) {
      await this.ghl.upsertOpportunity({
        contactEmail: payload?.contactEmail ?? payload?.email ?? payload?.contact?.email,
        ghlContactId: payload?.contactId ?? payload?.ghlContactId ?? payload?.contact?.id,
        amount: payload?.amount ?? payload?.opportunityValue,
        stage: payload?.stage ?? payload?.pipelineStage,
        saleValue: payload?.saleValue,
      });
      return { ok: true, handled: 'opportunity' };
    }

    if (type.includes('appointment')) {
      await this.ghl.upsertAppointment({
        id: payload?.id ?? payload?.eventId,
        type: payload?.type,
        status: payload?.status,
        startTime: payload?.scheduledAt ?? payload?.startTime,
        contactEmail: payload?.leadEmail ?? payload?.contact?.email,
        ghlContactId: payload?.contactId ?? payload?.ghlContactId ?? payload?.contact?.id,
        ownerEmail: payload?.ownerEmail ?? payload?.user?.email,
      });
      return { ok: true, handled: 'appointment' };
    }

    // fallback: on tente un best-effort (souvent GHL envoie des payloads sans "type" propre)
    if (payload?.contact || payload?.email) {
      await this.ghl.upsertContact({
        firstName: payload?.firstName ?? payload?.contact?.firstName,
        lastName: payload?.lastName ?? payload?.contact?.lastName,
        email: payload?.email ?? payload?.contact?.email,
        phone: payload?.phone ?? payload?.contact?.phone,
        tag: payload?.tag ?? payload?.source,
        ghlContactId: payload?.id ?? payload?.contactId ?? payload?.contact?.id,
        sourceTag: payload?.source,
      });
      return { ok: true, handled: 'contact-fallback' };
    }

    return { ok: true, handled: 'ignored' };
  }
}
