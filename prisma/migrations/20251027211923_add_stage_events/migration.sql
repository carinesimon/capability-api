-- CreateTable
CREATE TABLE "public"."StageEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStage" "public"."LeadStage",
    "toStage" "public"."LeadStage" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "externalId" TEXT,
    "dedupHash" TEXT,

    CONSTRAINT "StageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageEvent_externalId_key" ON "public"."StageEvent"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StageEvent_dedupHash_key" ON "public"."StageEvent"("dedupHash");

-- CreateIndex
CREATE INDEX "StageEvent_toStage_occurredAt_idx" ON "public"."StageEvent"("toStage", "occurredAt");

-- CreateIndex
CREATE INDEX "StageEvent_leadId_toStage_occurredAt_idx" ON "public"."StageEvent"("leadId", "toStage", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."StageEvent" ADD CONSTRAINT "StageEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
