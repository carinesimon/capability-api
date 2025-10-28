"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AppointmentsService = class AppointmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(dto) {
        return this.prisma.appointment.create({
            data: {
                type: dto.type,
                status: dto.status,
                scheduledAt: new Date(dto.scheduledAt),
                lead: { connect: { id: dto.leadId } },
                user: { connect: { id: dto.userId } },
            },
            include: { lead: true, user: true },
        });
    }
    findAll(params) {
        const { from, to, userId, type } = params ?? {};
        return this.prisma.appointment.findMany({
            where: {
                ...(userId ? { userId } : {}),
                ...(type ? { type } : {}),
                ...(from || to ? { scheduledAt: { gte: from, lte: to } } : {}),
            },
            orderBy: { scheduledAt: 'desc' },
            include: { lead: true, user: true },
        });
    }
    async timeToFirstContactMinutes(leadId) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return null;
        const firstRv0 = await this.prisma.appointment.findFirst({
            where: { leadId, type: 'RV0' },
            orderBy: { scheduledAt: 'asc' },
        });
        if (!firstRv0)
            return null;
        const diffMs = firstRv0.scheduledAt.getTime() - lead.createdAt.getTime();
        return Math.round(diffMs / 60000);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map