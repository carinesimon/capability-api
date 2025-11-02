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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const stage_events_service_1 = require("./stage-events.service");
let LeadsService = class LeadsService {
    prisma;
    stageEvents;
    constructor(prisma, stageEvents) {
        this.prisma = prisma;
        this.stageEvents = stageEvents;
    }
    async updateLeadStage(leadId, toStage, source, externalId) {
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: { stage: true },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        await this.stageEvents.recordStageEntry({
            leadId,
            fromStage: lead.stage,
            toStage,
            source,
            externalId,
        });
        await this.prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: toStage,
                stageUpdatedAt: new Date(),
                boardColumnKey: null,
            },
        });
        return { ok: true };
    }
    async moveToBoardColumn(leadId, columnKey) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        const normalized = columnKey.toUpperCase();
        const asStage = Object.values(client_1.LeadStage).find(s => s === normalized);
        if (asStage) {
            return this.updateLeadStage(leadId, asStage, 'ui:board-dnd');
        }
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { boardColumnKey: columnKey, stageUpdatedAt: new Date() },
        });
        return { ok: true };
    }
    async deleteLead(leadId) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        await this.prisma.lead.delete({ where: { id: leadId } });
        return { ok: true };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stage_events_service_1.StageEventsService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map