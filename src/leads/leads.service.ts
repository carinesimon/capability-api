import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttributionService } from '../attribution/attribution.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private attribution: AttributionService,
  ) {}

  async create(data: { firstName: string; lastName?: string; email?: string; tag?: string; setterId?: string }) {
    const lead = await this.prisma.lead.create({ data });
    if (!lead.setterId) {
      return this.attribution.ensureSetter(lead.id);
    }
    return lead;
  }

  findAll(params?: { from?: Date; to?: Date }) {
    const { from, to } = params ?? {};
    return this.prisma.lead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      include: { appointments: true, setter: true },
    });
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { appointments: true, setter: true },
    });
  }
}
