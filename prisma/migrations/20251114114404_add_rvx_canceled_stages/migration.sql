/*
  Warnings:

  - The values [APPOINTMENT_CANCELED] on the enum `LeadStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LeadStage_new" AS ENUM ('LEADS_RECEIVED', 'CALL_REQUESTED', 'CALL_ATTEMPT', 'CALL_ANSWERED', 'SETTER_NO_SHOW', 'FOLLOW_UP', 'RV0_PLANNED', 'RV0_HONORED', 'RV0_NO_SHOW', 'RV1_PLANNED', 'RV1_HONORED', 'RV1_NO_SHOW', 'RV1_POSTPONED', 'RV1_CANCELED', 'RV2_PLANNED', 'RV2_HONORED', 'RV2_POSTPONED', 'RV2_CANCELED', 'NOT_QUALIFIED', 'LOST', 'WON');
ALTER TABLE "public"."Lead" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "public"."Lead" ALTER COLUMN "stage" TYPE "public"."LeadStage_new" USING ("stage"::text::"public"."LeadStage_new");
ALTER TABLE "public"."ProspectsColumnConfig" ALTER COLUMN "stage" TYPE "public"."LeadStage_new" USING ("stage"::text::"public"."LeadStage_new");
ALTER TABLE "public"."StageEvent" ALTER COLUMN "fromStage" TYPE "public"."LeadStage_new" USING ("fromStage"::text::"public"."LeadStage_new");
ALTER TABLE "public"."StageEvent" ALTER COLUMN "toStage" TYPE "public"."LeadStage_new" USING ("toStage"::text::"public"."LeadStage_new");
ALTER TYPE "public"."LeadStage" RENAME TO "LeadStage_old";
ALTER TYPE "public"."LeadStage_new" RENAME TO "LeadStage";
DROP TYPE "public"."LeadStage_old";
ALTER TABLE "public"."Lead" ALTER COLUMN "stage" SET DEFAULT 'LEADS_RECEIVED';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PipelineMetricKey" ADD VALUE 'RV0_CANCELED';
ALTER TYPE "public"."PipelineMetricKey" ADD VALUE 'RV2_CANCELED';
