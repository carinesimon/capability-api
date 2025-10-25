-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "boardColumnKey" TEXT;

-- CreateTable
CREATE TABLE "public"."ProspectsColumnConfig" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "stage" "public"."LeadStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectsColumnConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectsColumnConfig_order_idx" ON "public"."ProspectsColumnConfig"("order");

-- CreateIndex
CREATE INDEX "Lead_boardColumnKey_idx" ON "public"."Lead"("boardColumnKey");
