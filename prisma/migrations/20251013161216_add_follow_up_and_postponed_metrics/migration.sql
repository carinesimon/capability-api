-- CreateEnum
CREATE TYPE "public"."PipelineMetricKey" AS ENUM ('LEADS_RECEIVED', 'CALL_REQUESTED', 'CALL_ATTEMPT', 'CALL_ANSWERED', 'SETTER_NO_SHOW', 'FOLLOW_UP', 'RV0_PLANNED', 'RV0_HONORED', 'RV0_NO_SHOW', 'RV1_PLANNED', 'RV1_HONORED', 'RV1_NO_SHOW', 'RV1_POSTPONED', 'RV2_PLANNED', 'RV2_HONORED', 'RV2_POSTPONED', 'WON');

-- AlterEnum
ALTER TYPE "public"."LeadStage" ADD VALUE 'FOLLOW_UP';

-- CreateTable
CREATE TABLE "public"."DashboardMetricConfig" (
    "id" TEXT NOT NULL,
    "key" "public"."PipelineMetricKey" NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardMetricConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardMetricConfig_key_key" ON "public"."DashboardMetricConfig"("key");

-- CreateIndex
CREATE INDEX "DashboardMetricConfig_position_idx" ON "public"."DashboardMetricConfig"("position");
