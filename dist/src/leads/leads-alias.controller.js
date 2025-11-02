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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsAliasController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const EVENT_TO_STAGE = {
    LEAD_CREATED: "LEAD_RECU",
    CALL_REQUESTED: "DEMANDE_APPEL",
    CALL_ATTEMPT: "APPEL_PASSE",
    CALL_ANSWERED: "APPEL_REPONDU",
    SETTER_NO_SHOW: "NO_SHOW_SETTER",
    FOLLOW_UP: "FOLLOW_UP",
    APPOINTMENT_PLANNED_RV0: "RV0_PLANIFIE",
    APPOINTMENT_HONORED_RV0: "RV0_HONORE",
    APPOINTMENT_NOSHOW_RV0: "RV0_NO_SHOW",
    APPOINTMENT_PLANNED_RV1: "RV1_PLANIFIE",
    APPOINTMENT_HONORED_RV1: "RV1_HONORE",
    APPOINTMENT_NOSHOW_RV1: "RV1_NO_SHOW",
    APPOINTMENT_POSTPONED_RV1: "RV1_NO_SHOW",
    APPOINTMENT_PLANNED_RV2: "RV2_PLANIFIE",
    APPOINTMENT_HONORED_RV2: "RV2_HONORE",
    APPOINTMENT_NOSHOW_RV2: "RV2_NO_SHOW",
    NOT_QUALIFIED: "NOT_QUALIFIED",
    LOST: "LOST",
    WON: "WON",
};
let LeadsAliasController = class LeadsAliasController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    forward(req, res, target) {
        const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
        return res.redirect(307, target + qs);
    }
    getBoard(req, res) {
        return this.forward(req, res, "/prospects/board");
    }
    getColumns(req, res) {
        return this.forward(req, res, "/prospects/columns-config");
    }
    saveColumns(req, res) {
        return this.forward(req, res, "/prospects/columns-config");
    }
    getActors(req, res) {
        return this.forward(req, res, "/prospects/actors");
    }
    createLead(req, res) {
        return this.forward(req, res, "/prospects");
    }
    getLead(req, res, id) {
        return this.forward(req, res, `/prospects/${id}`);
    }
    updateLead(req, res, id) {
        return this.forward(req, res, `/prospects/${id}`);
    }
    deleteLead(req, res, id) {
        return this.forward(req, res, `/prospects/${id}`);
    }
    changeStagePOST(req, res, id) {
        return this.forward(req, res, `/prospects/${id}/stage`);
    }
    changeStagePATCH(req, res, id) {
        return this.forward(req, res, `/prospects/${id}/stage`);
    }
    moveToBoard(req, res, id) {
        return this.forward(req, res, `/prospects/${id}/board`);
    }
    async addEvent(id, body) {
        const type = body?.type;
        const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date();
        if (type) {
            const stage = EVENT_TO_STAGE[type];
            if (stage) {
                try {
                    await this.prisma.leadStageHistory.upsert({
                        where: {
                            lead_stage_unique: {
                                leadId: id,
                                stage,
                            },
                        },
                        update: {},
                        create: {
                            leadId: id,
                            stage,
                            occurredAt,
                        },
                    });
                }
                catch (e) {
                }
            }
        }
        return {
            ok: true,
            leadId: id,
            received: body ?? null,
        };
    }
};
exports.LeadsAliasController = LeadsAliasController;
__decorate([
    (0, common_1.Get)("board"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "getBoard", null);
__decorate([
    (0, common_1.Get)("columns-config"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "getColumns", null);
__decorate([
    (0, common_1.Put)("columns-config"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "saveColumns", null);
__decorate([
    (0, common_1.Get)("actors"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "getActors", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "getLead", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "deleteLead", null);
__decorate([
    (0, common_1.Post)(":id/stage"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "changeStagePOST", null);
__decorate([
    (0, common_1.Patch)(":id/stage"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "changeStagePATCH", null);
__decorate([
    (0, common_1.Post)(":id/board"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], LeadsAliasController.prototype, "moveToBoard", null);
__decorate([
    (0, common_1.Post)(":id/events"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsAliasController.prototype, "addEvent", null);
exports.LeadsAliasController = LeadsAliasController = __decorate([
    (0, common_1.Controller)("leads"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsAliasController);
//# sourceMappingURL=leads-alias.controller.js.map