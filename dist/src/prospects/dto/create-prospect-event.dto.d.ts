export declare enum StageDto {
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
    NOT_QUALIFIED = "NOT_QUALIFIED"
}
export declare class CreateProspectEventDto {
    type: "STAGE_ENTERED" | "STAGE_LEFT" | "NOTE";
    stage?: StageDto;
    status?: string;
    occurredAt?: string;
}
export declare function normalizeStage(input?: string): StageDto | undefined;
