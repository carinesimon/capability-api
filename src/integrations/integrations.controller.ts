import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { LeadStage } from '@prisma/client';


@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  // ---- CRUD Automations ----
  @Get('automations')
  async list() {
    return this.svc.listAutomationsWithAbsoluteUrl();
  }

 @Get('lead-stages')
  getLeadStages() {
    // Renvoie les valeurs EXACTES de l’ENUM (ton schéma)
    return { stages: Object.values(LeadStage) };
  }

  @Post('automations')
  async create(@Body() body: { name: string }) {
    const a = await this.svc.createAutomation(body?.name || 'Sans titre');
    return this.svc.decorateAutomationAbsolute(a.id);
  }

 /* @Get('automations/:id')
  async get(@Param('id') id: string) {
    return this.svc.getAutomationWithAbsoluteUrl(id);
  }*/
@Get('automations/:id')
async get(@Param('id') id: string) {
  const a = await this.svc.getAutomationWithAbsoluteUrl(id);
  return { ...a, leadStages: Object.values(LeadStage) };
}

  @Patch('automations/:id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; status?: 'OFF'|'DRY_RUN'|'ON'; mappingJson?: any },
  ) {
    return this.svc.updateAutomation(id, body);
  }

  @Delete('automations/:id')
  async remove(@Param('id') id: string) {
    await this.svc.deleteAutomation(id);
    return { ok: true };
  }
    @Delete('leads/:id')
  async hardDeleteLead(@Param('id') id: string) {
    return this.svc.deleteLeadCompletely(id);
  }

  @Post('automations/:id/duplicate')
  async duplicate(@Param('id') id: string) {
    return this.svc.duplicateAutomation(id);
  }

  // ---- Events ----
  @Get('automations/:id/events')
  async events(@Param('id') id: string, @Query('limit') limit = '30') {
    const n = Math.max(1, Math.min(Number(limit) || 30, 1000));
    return this.svc.listEvents(id, n);
  }

  @Post('events/:eventId/replay')
  async replay(@Param('eventId') eventId: string) {
    return this.svc.replayEvent(eventId);
  }
  
}

