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
exports.CreateProspectEventDto = exports.StageDto = void 0;
exports.normalizeStage = normalizeStage;
const class_validator_1 = require("class-validator");
var StageDto;
(function (StageDto) {
    StageDto["LEAD_RECU"] = "LEAD_RECU";
    StageDto["DEMANDE_APPEL"] = "DEMANDE_APPEL";
    StageDto["APPEL_PASSE"] = "APPEL_PASSE";
    StageDto["APPEL_REPONDU"] = "APPEL_REPONDU";
    StageDto["NO_SHOW_SETTER"] = "NO_SHOW_SETTER";
    StageDto["RV0_PLANIFIE"] = "RV0_PLANIFIE";
    StageDto["RV0_HONORE"] = "RV0_HONORE";
    StageDto["RV0_NO_SHOW"] = "RV0_NO_SHOW";
    StageDto["RV1_PLANIFIE"] = "RV1_PLANIFIE";
    StageDto["RV1_HONORE"] = "RV1_HONORE";
    StageDto["RV1_NO_SHOW"] = "RV1_NO_SHOW";
    StageDto["RV2_PLANIFIE"] = "RV2_PLANIFIE";
    StageDto["RV2_HONORE"] = "RV2_HONORE";
    StageDto["RV0_ANNULE"] = "RV0_CANCELED";
    StageDto["RV1_ANNULE"] = "RV1_CANCELED";
    StageDto["RV2_ANNULE"] = "RV2_CANCELED";
    StageDto["WON"] = "WON";
    StageDto["LOST"] = "LOST";
    StageDto["NOT_QUALIFIED"] = "NOT_QUALIFIED";
})(StageDto || (exports.StageDto = StageDto = {}));
class CreateProspectEventDto {
    type;
    stage;
    status;
    occurredAt;
}
exports.CreateProspectEventDto = CreateProspectEventDto;
__decorate([
    (0, class_validator_1.IsIn)(["STAGE_ENTERED", "STAGE_LEFT", "NOTE"]),
    __metadata("design:type", String)
], CreateProspectEventDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProspectEventDto.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProspectEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProspectEventDto.prototype, "occurredAt", void 0);
function normalizeStage(input) {
    if (!input)
        return undefined;
    const k = input
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    const map = {
        LEAD_RECU: StageDto.LEAD_RECU, LEAD_RECU_: StageDto.LEAD_RECU,
        DEMANDE_APPEL: StageDto.DEMANDE_APPEL,
        APPEL_PASSE: StageDto.APPEL_PASSE,
        APPEL_REPONDU: StageDto.APPEL_REPONDU, APPEL_REPONDU_: StageDto.APPEL_REPONDU,
        NO_SHOW_SETTER: StageDto.NO_SHOW_SETTER,
        RV0_PLANIFIE: StageDto.RV0_PLANIFIE, RDV0_PLANIFIE: StageDto.RV0_PLANIFIE,
        RV0_HONORE: StageDto.RV0_HONORE, RV0_HONORE_: StageDto.RV0_HONORE, RDV0_HONORE: StageDto.RV0_HONORE,
        RV0_NO_SHOW: StageDto.RV0_NO_SHOW, RDV0_NO_SHOW: StageDto.RV0_NO_SHOW,
        RV1_PLANIFIE: StageDto.RV1_PLANIFIE, RDV1_PLANIFIE: StageDto.RV1_PLANIFIE,
        RV1_HONORE: StageDto.RV1_HONORE, RV1_HONORE_: StageDto.RV1_HONORE, RDV1_HONORE: StageDto.RV1_HONORE,
        RV1_NO_SHOW: StageDto.RV1_NO_SHOW, RDV1_NO_SHOW: StageDto.RV1_NO_SHOW,
        RV2_PLANIFIE: StageDto.RV2_PLANIFIE, RDV2_PLANIFIE: StageDto.RV2_PLANIFIE,
        RV2_HONORE: StageDto.RV2_HONORE, RV2_HONORE_: StageDto.RV2_HONORE, RDV2_HONORE: StageDto.RV2_HONORE,
        WON: StageDto.WON, LOST: StageDto.LOST, NOT_QUALIFIED: StageDto.NOT_QUALIFIED,
        RV0_ANNULE: StageDto.RV0_ANNULE,
        RV1_ANNULE: StageDto.RV1_ANNULE,
        RV2_ANNULE: StageDto.RV2_ANNULE,
        RV0_CANCELED: StageDto.RV0_ANNULE,
        RV1_CANCELED: StageDto.RV1_ANNULE,
        RV2_CANCELED: StageDto.RV2_ANNULE,
    };
    return map[k];
}
//# sourceMappingURL=create-prospect-event.dto.js.map