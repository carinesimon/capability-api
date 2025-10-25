import { Controller, Post, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // Route protégée (production-ready)
  @Post('seed-demo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async seedDemo(
    @Query('days') days = '60',
    @Query('setters') setters = '3',
    @Query('closers') closers = '3',
    @Query('leads') leads = '180',
  ) {
    const d = parseInt(days, 10) || 60;
    const s = parseInt(setters, 10) || 3;
    const c = parseInt(closers, 10) || 3;
    const l = parseInt(leads, 10) || 180;
    return this.admin.seedDemo({ days: d, setters: s, closers: c, leads: l });
  }

  // Route DEV (désactivée en prod) — à activer ponctuellement si besoin
  @Post('seed-demo-open')
  async seedDemoOpen(
    @Query('days') days = '60',
    @Query('setters') setters = '3',
    @Query('closers') closers = '3',
    @Query('leads') leads = '180',
  ) {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_OPEN_SEED !== '1') {
      throw new UnauthorizedException('Open seed is disabled. Set ALLOW_OPEN_SEED=1 (dev only).');
    }
    const d = parseInt(days, 10) || 60;
    const s = parseInt(setters, 10) || 3;
    const c = parseInt(closers, 10) || 3;
    const l = parseInt(leads, 10) || 180;
    return this.admin.seedDemo({ days: d, setters: s, closers: c, leads: l });
  }
}
