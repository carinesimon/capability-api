import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { LeadsService } from '../modules/leads/leads.service'; // <<< chemin correct

@Controller('prospects')
export class ProspectsCompatController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * POST /prospects/:id/events
   * body: { toStage?: LeadStage, columnKey?: string, source?: string, externalId?: string }
   */
  @Post(':id/events')
  async postEvent(
    @Param('id') id: string,
    @Body() body: { toStage?: LeadStage; columnKey?: string; source?: string; externalId?: string }
  ) {
    if (body?.toStage) {
      await this.leads.updateLeadStage(id, body.toStage, body.source ?? 'ui:compat', body.externalId);
      return { ok: true, via: 'compat:stage' };
    }
    if (body?.columnKey) {
      await this.leads.moveToBoardColumn(id, body.columnKey);
      return { ok: true, via: 'compat:board' };
    }
    return { ok: false, message: 'Payload invalide: toStage ou columnKey attendu' };
  }

  /** DELETE /prospects/:id */
  @Delete(':id')
  async deleteProspect(@Param('id') id: string) {
    await this.leads.deleteLead(id);
    return { ok: true };
  }
}
