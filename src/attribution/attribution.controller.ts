import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { AttributionService } from './attribution.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attribution')
export class AttributionController {
  constructor(private readonly service: AttributionService) {}

  /**
   * Force l’attribution d’un lead au prochain setter dispo si aucun setter n’est encore défini.
   * POST /attribution/ensure?leadId=...
   */
  @Post('ensure')
  async ensure(@Query('leadId') leadId: string) {
    return this.service.ensureSetter(leadId);
  }
}
