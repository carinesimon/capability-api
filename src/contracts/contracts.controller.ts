import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Post()
  create(@Body() body: CreateContractDto) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string, @Query('userId') userId?: string) {
    return this.service.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
    });
  }
  
}
