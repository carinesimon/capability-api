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
exports.AttributionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const partFromHour = (h) => (h < 12 ? 'MORNING' : 'AFTERNOON');
const dayFromDate = (d) => {
    const map = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return map[d.getDay()];
};
let AttributionService = class AttributionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async pickNextSetter(now = new Date()) {
        const setters = await this.prisma.user.findMany({
            where: { role: 'SETTER', isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true, firstName: true },
        });
        if (!setters.length)
            return null;
        let setting = await this.prisma.setting.findUnique({ where: { id: 1 } });
        if (!setting)
            setting = await this.prisma.setting.create({ data: { id: 1 } });
        const day = dayFromDate(now);
        const part = partFromHour(now.getHours());
        const avail = await this.prisma.availability.findMany({
            where: { day: day, part: part, user: { role: 'SETTER', isActive: true } },
            select: { userId: true },
        });
        const allowed = new Set(avail.map(a => a.userId));
        const pool = setters.filter(s => (allowed.size ? allowed.has(s.id) : true));
        if (!pool.length)
            return null;
        const lastIndex = setting.lastSetterId ? pool.findIndex(s => s.id === setting.lastSetterId) : -1;
        const nextIndex = (lastIndex + 1) % pool.length;
        const chosen = pool[nextIndex];
        await this.prisma.setting.update({ where: { id: 1 }, data: { lastSetterId: chosen.id } });
        return chosen;
    }
    async ensureSetter(leadId, when = new Date()) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            throw new Error('Lead not found');
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
};
exports.AttributionService = AttributionService;
exports.AttributionService = AttributionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttributionService);
//# sourceMappingURL=attribution.service.js.map