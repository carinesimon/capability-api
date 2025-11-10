import { IsDateString, IsEnum, IsIn, IsOptional, IsString } from "class-validator";

export enum StageDto {
  LEAD_RECU = "LEAD_RECU",
  DEMANDE_APPEL = "DEMANDE_APPEL",
  APPEL_PASSE = "APPEL_PASSE",
  APPEL_REPONDU = "APPEL_REPONDU",
  NO_SHOW_SETTER = "NO_SHOW_SETTER",
  RV0_PLANIFIE = "RV0_PLANIFIE",
  RV0_HONORE = "RV0_HONORE",
  RV0_NO_SHOW = "RV0_NO_SHOW",
  RV1_PLANIFIE = "RV1_PLANIFIE",
  RV1_HONORE = "RV1_HONORE",
  RV1_NO_SHOW = "RV1_NO_SHOW",
  RV2_PLANIFIE = "RV2_PLANIFIE",
  RV2_HONORE = "RV2_HONORE",
  WON = "WON",
  LOST = "LOST",
  NOT_QUALIFIED = "NOT_QUALIFIED",
}

export class CreateProspectEventDto {
  /** Type d’event — on reste simple */
  @IsIn(["STAGE_ENTERED","STAGE_LEFT","NOTE"])
  type!: "STAGE_ENTERED" | "STAGE_LEFT" | "NOTE";

  /** Stage cible (pour STAGE_ENTERED/STAGE_LEFT) */
  @IsOptional()
  @IsEnum(StageDto)
  stage?: StageDto;

  /** Statut optionnel (HONORED | NO_SHOW | POSTPONED …) */
  @IsOptional()
  @IsString()
  status?: string;

  /** Datation optionnelle (sinon now) */
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

/** Normalise des variantes “FR/accents/EN” vers le Stage enum côté Prisma */
export function normalizeStage(input?: string): StageDto | undefined {
  if (!input) return undefined;
  const k = input
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const map: Record<string, StageDto> = {
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
  };
  return map[k];
  
}
