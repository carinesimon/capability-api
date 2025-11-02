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
exports.LeadStageService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let LeadStageService = class LeadStageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async moveLeadToStage(input) {
        const { leadId, toStage } = input;
        const occurredAt = input.occurredAt ?? new Date();
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: { stage: true },
        });
        if (!lead) {
            throw new common_1.BadRequestException('Lead not found');
        }
        const fromStage = lead.stage;
        let eventId;
        if (input.externalId) {
            eventId = `stage-enter:${input.externalId}`;
        }
        else {
            const minuteBucket = new Date(occurredAt);
            minuteBucket.setSeconds(0, 0);
            const hash = crypto
                .createHash('sha256')
                .update(`${leadId}|${toStage}|${minuteBucket.toISOString()}`)
                .digest('hex');
            eventId = `stage-enter:${hash}`;
        }
        const event = await this.prisma.leadEvent.upsert({
            where: { id: eventId },
            create: {
                id: eventId,
                leadId,
                type: toStage,
                occurredAt,
                meta: {
                    toStage,
                    fromStage,
                    source: input.source ?? null,
                    actorId: input.actorId ?? null,
                },
            },
            update: {},
        });
        if (fromStage !== toStage) {
            await this.prisma.lead.update({
                where: { id: leadId },
                data: {
                    stage: toStage,
                    stageUpdatedAt: new Date(),
                },
            });
        }
        return event;
    }
    async recordStageEntry(input) {
        return this.moveLeadToStage(input);
    }
    async getFunnelStats(params) {
        const { start, end, stages, distinctLeads } = params;
        const stagesToCount = stages ?? Object.values(client_1.LeadStage);
        const out = {};
        for (const s of stagesToCount)
            out[s] = 0;
        const events = await this.prisma.leadEvent.findMany({
            where: {
                type: { in: stagesToCount.map((s) => s) },
                occurredAt: { gte: start, lt: end },
            },
            select: {
                leadId: true,
                type: true,
            },
        });
        if (!distinctLeads) {
            for (const ev of events) {
                const stage = ev.type;
                if (stagesToCount.includes(stage)) {
                    out[stage] = (out[stage] ?? 0) + 1;
                }
            }
        }
        else {
            const perStage = new Map();
            for (const s of stagesToCount)
                perStage.set(s, new Set());
            for (const ev of events) {
                const stage = ev.type;
                if (stagesToCount.includes(stage)) {
                    perStage.get(stage).add(ev.leadId);
                }
            }
            for (const s of stagesToCount) {
                out[s] = perStage.get(s).size;
            }
        }
        return out;
    }
};
exports.LeadStageService = LeadStageService;
exports.LeadStageService = LeadStageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadStageService);
//# sourceMappingURL=lead-stage.service.js.map