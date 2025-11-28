-- AlterEnum
ALTER TYPE "public"."LeadStage" ADD VALUE 'RV0_POSTPONED';

-- AlterTable
ALTER TABLE "public"."StageEvent" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "StageEvent_userId_occurredAt_idx" ON "public"."StageEvent"("userId", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."StageEvent" ADD CONSTRAINT "StageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
