import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, AppointmentType, Role, BudgetPeriod } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

type SeedOpts = { days: number; setters: number; closers: number; leads: number };

function randPick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function withinDays(days: number) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const t = randInt(past.getTime(), now.getTime());
  return new Date(t);
}
function startOfWeek(d: Date) {
  const dd = new Date(d);
  const day = dd.getDay(); // 0=dim
  const diff = (day + 6) % 7; // lundi = 0
  dd.setDate(dd.getDate() - diff);
  dd.setHours(0, 0, 0, 0);
  return dd;
}
function euro(n: number) { return Math.round(n / 10) * 10; }

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async seedDemo({ days, setters, closers, leads }: SeedOpts) {
    // 1) Admin (au cas où)
    const adminEmail = 'admin@example.com';
    const adminPass = 'Admin123!';
    const hash = await bcrypt.hash(adminPass, 10);
    await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: Role.ADMIN, isActive: true, firstName: 'Admin' },
      create: { email: adminEmail, role: Role.ADMIN, isActive: true, firstName: 'Admin', passwordHash: hash },
    });

    // 2) Setters
    const setterIds: string[] = [];
    for (let i = 1; i <= setters; i++) {
      const email = `setter${i}@example.com`;
      const u = await this.prisma.user.upsert({
        where: { email },
        update: { role: Role.SETTER, isActive: true, firstName: `Setter ${i}` },
        create: { email, role: Role.SETTER, isActive: true, firstName: `Setter ${i}` },
      });
      setterIds.push(u.id);
    }

    // 3) Closers
    const closerIds: string[] = [];
    for (let i = 1; i <= closers; i++) {
      const email = `closer${i}@example.com`;
      const u = await this.prisma.user.upsert({
        where: { email },
        update: { role: Role.CLOSER, isActive: true, firstName: `Closer ${i}` },
        create: { email, role: Role.CLOSER, isActive: true, firstName: `Closer ${i}` },
      });
      closerIds.push(u.id);
    }

    // 4) Budgets hebdo
    const now = new Date();
    const firstDay = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    let cursor = startOfWeek(firstDay);
    while (cursor <= now) {
      const weekStart = new Date(cursor);
      const amount = euro(randInt(800, 2500));

      const existing = await this.prisma.budget.findFirst({
        where: { period: BudgetPeriod.WEEKLY, weekStart },
        select: { id: true },
      }).catch(() => null);

      if (existing) {
        await this.prisma.budget.update({ where: { id: existing.id }, data: { amount } }).catch(() => {});
      } else {
        await this.prisma.budget.create({ data: { period: BudgetPeriod.WEEKLY, weekStart, amount } }).catch(() => {});
      }

      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    // 5) Leads + RV0/RV1/RV2 + Contrats
    const tags = ['FB', 'IG', 'YT', 'GADS'];
    let createdLeads = 0, rv0 = 0, rv1 = 0, rv2 = 0, sales = 0, revenue = 0;

    for (let i = 0; i < leads; i++) {
      const createdAt = withinDays(days);
      const email = `lead${crypto.randomBytes(4).toString('hex')}@example.com`;
      const setterId = randPick(setterIds);

      const lead = await this.prisma.lead.create({
        data: {
          firstName: `Lead${i + 1}`,
          email,
          tag: randPick(tags),
          createdAt,
          setterId,
          stage: 'RV0_PLANNED',   // nouveau enum
          stageUpdatedAt: createdAt,
        },
      });
      createdLeads++;

      // RV0 (Setter) ~80%
      if (Math.random() < 0.8) {
        const rv0Date = new Date(createdAt.getTime() + randInt(10, 240) * 60000);
        await this.prisma.appointment.create({
          data: {
            type: AppointmentType.RV0,
            status: AppointmentStatus.HONORED,
            scheduledAt: rv0Date,
            leadId: lead.id,
            userId: setterId,
          },
        });
        rv0++;

        // RV1 (Closer) ~60%
        if (Math.random() < 0.6) {
          const closerId = randPick(closerIds);
          const status = randPick([
            AppointmentStatus.HONORED,
            AppointmentStatus.NO_SHOW,
            AppointmentStatus.POSTPONED,
            AppointmentStatus.CANCELED,
          ]);
          const rv1Date = new Date(rv0Date.getTime() + randInt(60, 72 * 60) * 60000);
          await this.prisma.appointment.create({
            data: {
              type: AppointmentType.RV1,
              status,
              scheduledAt: rv1Date,
              leadId: lead.id,
              userId: closerId,
            },
          });
          rv1++;

          // Si RV1 honoré → vente directe (50%) ou RV2
          if (status === AppointmentStatus.HONORED) {
            if (Math.random() < 0.5) {
              const total = euro(randInt(500, 3000));
              await this.prisma.contract.create({
                data: {
                  userId: closerId,
                  leadId: lead.id,
                  amount: total,
                  total,
                  createdAt: new Date(rv1Date.getTime() + 30 * 60000),
                },
              });
              sales++; revenue += total;
              await this.prisma.lead.update({
                where: { id: lead.id },
                data: { stage: 'WON', stageUpdatedAt: new Date() },
              });
            } else {
              // RV2
              const rv2Date = new Date(rv1Date.getTime() + randInt(24 * 60, 10 * 24 * 60) * 60000);
              const status2 = randPick([
                AppointmentStatus.HONORED,
                AppointmentStatus.NO_SHOW,
                AppointmentStatus.POSTPONED,
                AppointmentStatus.CANCELED,
              ]);
              await this.prisma.appointment.create({
                data: {
                  type: AppointmentType.RV2,
                  status: status2,
                  scheduledAt: rv2Date,
                  leadId: lead.id,
                  userId: closerId,
                },
              });
              rv2++;

              if (status2 === AppointmentStatus.HONORED && Math.random() < 0.6) {
                const total = euro(randInt(500, 5000));
                await this.prisma.contract.create({
                  data: {
                    userId: closerId,
                    leadId: lead.id,
                    amount: total,
                    total,
                    createdAt: new Date(rv2Date.getTime() + 45 * 60000),
                  },
                });
                sales++; revenue += total;
                await this.prisma.lead.update({
                  where: { id: lead.id },
                  data: { stage: 'WON', stageUpdatedAt: new Date() },
                });
              }
            }
          }
        }
      }
    }

    return {
      message: 'Seed demo done',
      summary: { setters: setterIds.length, closers: closerIds.length, leads: createdLeads, rv0, rv1, rv2, sales, revenue },
    };
  }
}
