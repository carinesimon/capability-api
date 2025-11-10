import { Body, Controller, Param, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadStage } from '@prisma/client';

@Controller('leads')
export class LeadsController {
  constructor(private leads: LeadsService) {}

  @Post(':id/stage')
  moveStage(
    @Param('id') id: string,
    @Body() body: { toStage: LeadStage; source?: string; externalId?: string },
  ) {
    return this.leads.updateLeadStage(id, body.toStage, body.source, body.externalId);
  }

  @Post(':id/board')
  moveBoard(
    @Param('id') id: string,
    @Body() body: { columnKey: string },
  ) {
    return this.leads.moveToBoardColumn(id, body.columnKey);
  }
  
}