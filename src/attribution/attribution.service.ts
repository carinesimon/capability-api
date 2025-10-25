import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DayPart = 'MORNING' | 'AFTERNOON';
const partFromHour = (h: number): DayPart => (h < 12 ? 'MORNING' : 'AFTERNOON');
const dayFromDate = (d: Date): 'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN' => {
  const map = ['SUN','MON','TUE','WED','THU','FRI','SAT'] as const;
  return map[d.getDay()];
};

@Injectable()
export class AttributionService {
  constructor(private prisma: PrismaService) {}

  async pickNextSetter(now = new Date()): Promise<{ id: string; firstName: string } | null> {
    const setters = await this.prisma.user.findMany({
      where: { role: 'SETTER', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, firstName: true },
    });
    if (!setters.length) return null;

    let setting = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (!setting) setting = await this.prisma.setting.create({ data: { id: 1 } });

    const day = dayFromDate(now);
    const part = partFromHour(now.getHours());

    const avail = await this.prisma.availability.findMany({
      where: { day: day as any, part: part as any, user: { role: 'SETTER', isActive: true } },
      select: { userId: true },
    });

    const allowed = new Set(avail.map(a => a.userId));
    const pool = setters.filter(s => (allowed.size ? allowed.has(s.id) : true));
    if (!pool.length) return null;

    const lastIndex = setting.lastSetterId ? pool.findIndex(s => s.id === setting.lastSetterId) : -1;
    const nextIndex = (lastIndex + 1) % pool.length;
    const chosen = pool[nextIndex];

    await this.prisma.setting.update({ where: { id: 1 }, data: { lastSetterId: chosen.id } });
    return chosen;
  }

  /** Assigne un lead si pas encore de setter */
  async ensureSetter(leadId: string, when = new Date()) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');
    if (lead.setterId) {
      return this.prisma.lead.findUnique({ where: { id: leadId }, include: { setter: true } });
    }
    const setter = await this.pickNextSetter(when);
    if (!setter) {
      return this.prisma.lead.findUnique({ where: { id: leadId }, include: { setter: true } });
    }
    return this.prisma.lead.update({
      where: { id: leadId },
      data: { setterId: setter.id },
      include: { setter: true },
    });
  }
}
