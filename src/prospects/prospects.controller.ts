// prospects.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { LeadStage, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProspectEventDto } from './dto/create-prospect-event.dto';
import { parseCsvIds } from '../common/http/parseCsvIds';

@Controller('prospects')
export class ProspectsController {
  constructor(
    private readonly svc: ProspectsService,
    private readonly prisma: PrismaService,
  ) {}

  /* ===== Board & colonnes ===== */
  @Get('stage-options')
  async stageOptions() {
    const rows = await this.prisma.prospectsColumnConfig.findMany({
      where: { enabled: true, NOT: { stage: null } },
      select: { label: true, stage: true, order: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((r) => ({ value: r.stage as LeadStage, label: r.label }));
  }

  @Get('board')
  getBoard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('setterIds') setterIdsRaw?: string,
    @Query('closerIds') closerIdsRaw?: string,
  ) {
    const setterIds = parseCsvIds(setterIdsRaw);
    const closerIds = parseCsvIds(closerIdsRaw);
    return this.svc.getBoard({
      from,
      to,
      limit: Number(limit ?? 200),
      setterIds,
      closerIds,
    });
  }

  @Get('columns-config')
  getColumnsConfig() {
    return this.svc.getColumnsConfig();
  }

  @Put('columns-config')
  putColumnsConfig(
    @Body()
    payload: Array<{
      id: string;
      label: string;
      order: number;
      enabled: boolean;
      stage?: LeadStage | null;
    }>,
  ) {
    return this.svc.putColumnsConfig(payload);
  }

  /* ===== Acteurs (SETTER / CLOSER) ===== */
  @Get('actors')
  async actors() {
    const rows = await this.prisma.user.findMany({
      where: { role: { in: [Role.SETTER, Role.CLOSER] }, isActive: true },
      select: { id: true, firstName: true, email: true, role: true },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
    const setters = rows
      .filter((r) => r.role === Role.SETTER)
      .map((r) => ({ id: r.id, firstName: r.firstName, email: r.email }));
    const closers = rows
      .filter((r) => r.role === Role.CLOSER)
      .map((r) => ({ id: r.id, firstName: r.firstName, email: r.email }));
    return { setters, closers };
  }

  /* ===== Event (drag&drop) ===== */
  @Post(':id/events')
  async addEvent(
    @Param('id') id: string,
    @Body() dto: CreateProspectEventDto,
  ) {
    return this.svc.addEvent(id, dto);
  }

  /* ===== CRUD Lead ===== */
  @Post()
  createLead(
    @Body()
    body: {
      firstName: string;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      tag?: string | null;
      source?: string | null;
      opportunityValue?: number | null;
      saleValue?: number | null;
      stage?: LeadStage;
      setterId?: string | null;
      closerId?: string | null;
    },
  ) {
    return this.svc.createLead(body as any);
  }

  @Patch(':id/stage')
  moveStage(
    @Param('id') id: string,
    @Body()
    body: {
      stage: LeadStage;
      saleValue?: number;
      confirmSame?: boolean;
    },
  ) {
    return this.svc.moveStage(id, body as any);
  }

    // 🔹 Déplacement dans une colonne libre (ex: "RDV annulés")
  @Patch(':id/board-column')
  async setBoardColumn(
    @Param('id') id: string,
    @Body() body: { columnKey?: string | null },
  ) {
    // si tu veux le comportement “intelligent” qui logge un StageEvent SI la colonne est mappée :
    return this.svc.moveToFreeColumn(id, body.columnKey ?? '');
  }

  @Patch(':id')
  updateOne(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
      tag?: string | null;
      source?: string | null;
      opportunityValue?: number | null;
      saleValue?: number | null;
      setterId?: string | null;
      closerId?: string | null;
    },
  ) {
    return this.svc.updateOne(id, body);
  }

  // ⚠️ Garder cette route APRÈS toutes les routes statiques
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getOne(id);
  }

}

