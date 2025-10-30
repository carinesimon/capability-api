import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metrics: MetricsService) {}

  @Get('funnel')
  async getFunnel(@Query('start') start: string, @Query('end') end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const totals = await this.metrics.funnelTotals({ start: s, end: e });
    return { totals };
  }
  
}
