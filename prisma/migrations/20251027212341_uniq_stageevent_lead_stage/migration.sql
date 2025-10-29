/*
  Warnings:

  - A unique constraint covering the columns `[leadId,toStage]` on the table `StageEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StageEvent_leadId_toStage_key" ON "public"."StageEvent"("leadId", "toStage");
