import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        amount: dto.amount,
        deposit: dto.deposit,
        monthly: dto.monthly,
        total: dto.total,
        user: { connect: { id: dto.userId } },
        ...(dto.leadId ? { lead: { connect: { id: dto.leadId } } } : {}),
      },
      include: { user: true, lead: true },
    });
  }

  findAll(params?: { from?: Date; to?: Date; userId?: string }) {
    const { from, to, userId } = params ?? {};
    return this.prisma.contract.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true, lead: true },
    });
  }
  
}
