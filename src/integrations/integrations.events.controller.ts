import { Controller, HttpCode, Param, Post, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

type ReplayMode = 'upsert' | 'createNew';

@Controller('integrations/events')
export class IntegrationsEventsController {
  constructor(private readonly svc: IntegrationsService) {}

  /**
   * Rejoue un événement (même payload) avec stratégie:
   *  - mode=upsert (défaut): met à jour ou crée selon email/ghlContactId
   *  - mode=createNew: force la création d’un nouveau lead (sans toucher l’existant)
   *
   * POST /integrations/events/:id/replay?mode=createNew
   */
  @Post(':id/replay')
  @HttpCode(200)
  async replay(
    @Param('id') id: string,
    @Query('mode') modeParam?: string,
  ) {
    const mode: ReplayMode = modeParam === 'createNew' ? 'createNew' : 'upsert';
    const result = await this.svc.replayEvent(id, { mode });
    // `result` contient déjà { ok: true, ... } → on le renvoie tel quel
    return result;
  }
}
