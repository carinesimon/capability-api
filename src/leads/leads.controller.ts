import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() body: { firstName: string; lastName?: string; email: string; tag?: string; assignedTo?: string }) {
    return this.leadsService.create(body);
  }

  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.leadsService.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }
}
