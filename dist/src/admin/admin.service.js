"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function withinDays(days) {
    const now = new Date();
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const t = randInt(past.getTime(), now.getTime());
    return new Date(t);
}
function startOfWeek(d) {
    const dd = new Date(d);
    const day = dd.getDay();
    const diff = (day + 6) % 7;
    dd.setDate(dd.getDate() - diff);
    dd.setHours(0, 0, 0, 0);
    return dd;
}
function euro(n) { return Math.round(n / 10) * 10; }
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDemo({ days, setters, closers, leads }) {
        const adminEmail = 'admin@example.com';
        const adminPass = 'Admin123!';
        const hash = await bcrypt.hash(adminPass, 10);
        await this.prisma.user.upsert({
            where: { email: adminEmail },
            update: { role: client_1.Role.ADMIN, isActive: true, firstName: 'Admin' },
            create: { email: adminEmail, role: client_1.Role.ADMIN, isActive: true, firstName: 'Admin', passwordHash: hash },
        });
        const setterIds = [];
        for (let i = 1; i <= setters; i++) {
            const email = `setter${i}@example.com`;
            const u = await this.prisma.user.upsert({
                where: { email },
                update: { role: client_1.Role.SETTER, isActive: true, firstName: `Setter ${i}` },
                create: { email, role: client_1.Role.SETTER, isActive: true, firstName: `Setter ${i}` },
            });
            setterIds.push(u.id);
        }
        const closerIds = [];
        for (let i = 1; i <= closers; i++) {
            const email = `closer${i}@example.com`;
            const u = await this.prisma.user.upsert({
                where: { email },
                update: { role: client_1.Role.CLOSER, isActive: true, firstName: `Closer ${i}` },
                create: { email, role: client_1.Role.CLOSER, isActive: true, firstName: `Closer ${i}` },
            });
            closerIds.push(u.id);
        }
        const now = new Date();
        const firstDay = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        let cursor = startOfWeek(firstDay);
        while (cursor <= now) {
            const weekStart = new Date(cursor);
            const amount = euro(randInt(800, 2500));
            const existing = await this.prisma.budget.findFirst({
                where: { period: client_1.BudgetPeriod.WEEKLY, weekStart },
                select: { id: true },
            }).catch(() => null);
            if (existing) {
                await this.prisma.budget.update({ where: { id: existing.id }, data: { amount } }).catch(() => { });
            }
            else {
                await this.prisma.budget.create({ data: { period: client_1.BudgetPeriod.WEEKLY, weekStart, amount } }).catch(() => { });
            }
            cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
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
                    stage: 'RV0_PLANNED',
                    stageUpdatedAt: createdAt,
                },
            });
            createdLeads++;
            if (Math.random() < 0.8) {
                const rv0Date = new Date(createdAt.getTime() + randInt(10, 240) * 60000);
                await this.prisma.appointment.create({
                    data: {
                        type: client_1.AppointmentType.RV0,
                        status: client_1.AppointmentStatus.HONORED,
                        scheduledAt: rv0Date,
                        leadId: lead.id,
                        userId: setterId,
                    },
                });
                rv0++;
                if (Math.random() < 0.6) {
                    const closerId = randPick(closerIds);
                    const status = randPick([
                        client_1.AppointmentStatus.HONORED,
                        client_1.AppointmentStatus.NO_SHOW,
                        client_1.AppointmentStatus.POSTPONED,
                        client_1.AppointmentStatus.CANCELED,
                    ]);
                    const rv1Date = new Date(rv0Date.getTime() + randInt(60, 72 * 60) * 60000);
                    await this.prisma.appointment.create({
                        data: {
                            type: client_1.AppointmentType.RV1,
                            status,
                            scheduledAt: rv1Date,
                            leadId: lead.id,
                            userId: closerId,
                        },
                    });
                    rv1++;
                    if (status === client_1.AppointmentStatus.HONORED) {
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
                            sales++;
                            revenue += total;
                            await this.prisma.lead.update({
                                where: { id: lead.id },
                                data: { stage: 'WON', stageUpdatedAt: new Date() },
                            });
                        }
                        else {
                            const rv2Date = new Date(rv1Date.getTime() + randInt(24 * 60, 10 * 24 * 60) * 60000);
                            const status2 = randPick([
                                client_1.AppointmentStatus.HONORED,
                                client_1.AppointmentStatus.NO_SHOW,
                                client_1.AppointmentStatus.POSTPONED,
                                client_1.AppointmentStatus.CANCELED,
                            ]);
                            await this.prisma.appointment.create({
                                data: {
                                    type: client_1.AppointmentType.RV2,
                                    status: status2,
                                    scheduledAt: rv2Date,
                                    leadId: lead.id,
                                    userId: closerId,
                                },
                            });
                            rv2++;
                            if (status2 === client_1.AppointmentStatus.HONORED && Math.random() < 0.6) {
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
                                sales++;
                                revenue += total;
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map