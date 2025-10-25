-- AlterTable
ALTER TABLE "public"."Automation" ADD COLUMN     "metaJson" JSONB;

-- CreateTable
CREATE TABLE "public"."LeadBoardEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "columnKey" TEXT NOT NULL,
    "previousKey" TEXT,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadBoardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meta" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadBoardEvent_movedAt_idx" ON "public"."LeadBoardEvent"("movedAt");

-- CreateIndex
CREATE INDEX "LeadEvent_type_occurredAt_idx" ON "public"."LeadEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_occurredAt_idx" ON "public"."LeadEvent"("leadId", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."LeadBoardEvent" ADD CONSTRAINT "LeadBoardEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

