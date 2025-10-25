-- CreateEnum
CREATE TYPE "public"."AutomationStatus" AS ENUM ('OFF', 'DRY_RUN', 'ON');

-- CreateTable
CREATE TABLE "public"."AutomationEvent" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "contentType" TEXT,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "result" JSONB,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "status" "public"."AutomationStatus" NOT NULL DEFAULT 'ON',
    "mappingJson" JSONB,
    "rulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationEvent_automationId_receivedAt_idx" ON "public"."AutomationEvent"("automationId", "receivedAt");

-- CreateIndex
CREATE INDEX "AutomationEvent_status_receivedAt_idx" ON "public"."AutomationEvent"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "AutomationEvent_payloadHash_idx" ON "public"."AutomationEvent"("payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "Automation_routeKey_key" ON "public"."Automation"("routeKey");

-- AddForeignKey
ALTER TABLE "public"."AutomationEvent" ADD CONSTRAINT "AutomationEvent_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
