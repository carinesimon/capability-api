import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentType } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  create(@Body() body: CreateAppointmentDto) {
    return this.service.create(body);
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: AppointmentType,
  ) {
    return this.service.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
      type,
    });
    
  }

  @Get('ttfc')
  async ttfc(@Query('leadId') leadId: string) {
    const minutes = await this.service.timeToFirstContactMinutes(leadId);
    return { leadId, timeToFirstContactMinutes: minutes };
  }
}

