-- 1) Nouveau type ENUM complet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStage_new') THEN
    CREATE TYPE "LeadStage_new" AS ENUM (
      'LEADS_RECEIVED',
      'CALL_REQUESTED',
      'CALL_ATTEMPT',
      'CALL_ANSWERED',
      'SETTER_NO_SHOW',
      'FOLLOW_UP',
      'RV0_PLANNED',
      'RV0_HONORED',
      'RV0_NO_SHOW',
      'RV1_PLANNED',
      'RV1_HONORED',
      'RV1_NO_SHOW',
      'RV1_POSTPONED',
      'RV2_PLANNED',
      'RV2_HONORED',
      'RV2_POSTPONED',
      'NOT_QUALIFIED',
      'LOST',
      'WON'
    );
  END IF;
END $$;

-- 2) Lead.stage -> nouveau type avec mapping des anciennes valeurs
ALTER TABLE "Lead"
  ALTER COLUMN "stage" DROP DEFAULT,
  ALTER COLUMN "stage" TYPE "LeadStage_new"
  USING (
    CASE "stage"::text
      WHEN 'UNASSIGNED'     THEN 'LEADS_RECEIVED'
      WHEN 'RV0'            THEN 'RV0_PLANNED'
      WHEN 'RV1'            THEN 'RV1_PLANNED'
      WHEN 'RV2'            THEN 'RV2_PLANNED'
      WHEN 'FOLLOW_UP'      THEN 'FOLLOW_UP'
      WHEN 'NOT_QUALIFIED'  THEN 'NOT_QUALIFIED'
      WHEN 'LOST'           THEN 'LOST'
      WHEN 'WON'            THEN 'WON'
      ELSE 'LEADS_RECEIVED'
    END
  )::"LeadStage_new";

ALTER TABLE "Lead"
  ALTER COLUMN "stage" SET DEFAULT 'LEADS_RECEIVED'::"LeadStage_new";

-- 3) ProspectsColumnConfig.stage -> nouveau type si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProspectsColumnConfig'
      AND column_name = 'stage'
  ) THEN
    ALTER TABLE "ProspectsColumnConfig"
      ALTER COLUMN "stage" TYPE "LeadStage_new"
      USING (
        CASE "stage"::text
          WHEN 'UNASSIGNED'     THEN 'LEADS_RECEIVED'
          WHEN 'RV0'            THEN 'RV0_PLANNED'
          WHEN 'RV1'            THEN 'RV1_PLANNED'
          WHEN 'RV2'            THEN 'RV2_PLANNED'
          WHEN 'FOLLOW_UP'      THEN 'FOLLOW_UP'
          WHEN 'NOT_QUALIFIED'  THEN 'NOT_QUALIFIED'
          WHEN 'LOST'           THEN 'LOST'
          WHEN 'WON'            THEN 'WON'
          ELSE NULL
        END
      )::"LeadStage_new";
  END IF;
END $$;

-- 4) Drop ancien type et renomme le nouveau en LeadStage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStage') THEN
    DROP TYPE "LeadStage";
  END IF;
END $$;

ALTER TYPE "LeadStage_new" RENAME TO "LeadStage";
