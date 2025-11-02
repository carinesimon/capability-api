-- CreateTable
CREATE TABLE "public"."LeadStageHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_stage_by_stage_date" ON "public"."LeadStageHistory"("stage", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStageHistory_leadId_stage_key" ON "public"."LeadStageHistory"("leadId", "stage");
