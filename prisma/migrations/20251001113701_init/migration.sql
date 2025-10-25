-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SETTER', 'CLOSER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('RV0', 'RV1', 'RV2');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('HONORED', 'POSTPONED', 'CANCELED', 'NO_SHOW', 'NOT_QUALIFIED');

-- CreateEnum
CREATE TYPE "public"."BudgetPeriod" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "public"."LeadStage" AS ENUM ('UNASSIGNED', 'RV0', 'RV1', 'RV2', 'WON', 'LOST', 'NOT_QUALIFIED');

-- CreateEnum
CREATE TYPE "public"."DayPart" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "public"."CallRequestStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."CallOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'BUSY', 'VOICEMAIL', 'WRONG_NUMBER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordHash" TEXT,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tag" TEXT,
    "source" TEXT,
    "stage" "public"."LeadStage" NOT NULL DEFAULT 'UNASSIGNED',
    "stageUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunityValue" DOUBLE PRECISION,
    "saleValue" DOUBLE PRECISION,
    "setterId" TEXT,
    "closerId" TEXT,
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'INTERNAL',
    "externalId" TEXT NOT NULL,
    "type" "public"."AppointmentType" NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    "userId" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "monthly" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Budget" (
    "id" TEXT NOT NULL,
    "period" "public"."BudgetPeriod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "weekStart" TIMESTAMP(3),
    "monthStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Availability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" "public"."DayOfWeek" NOT NULL,
    "part" "public"."DayPart" NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastSetterId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallRequest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdById" TEXT,
    "channel" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "status" "public"."CallRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallAttempt" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "outcome" "public"."CallOutcome" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "public"."User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "public"."Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_ghlContactId_key" ON "public"."Lead"("ghlContactId");

-- CreateIndex
CREATE INDEX "Lead_stage_stageUpdatedAt_idx" ON "public"."Lead"("stage", "stageUpdatedAt");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "public"."Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_setterId_idx" ON "public"."Lead"("setterId");

-- CreateIndex
CREATE INDEX "Lead_closerId_idx" ON "public"."Lead"("closerId");

-- CreateIndex
CREATE INDEX "Lead_stage_setterId_idx" ON "public"."Lead"("stage", "setterId");

-- CreateIndex
CREATE INDEX "Lead_stage_closerId_idx" ON "public"."Lead"("stage", "closerId");

-- CreateIndex
CREATE INDEX "Lead_stage_createdAt_idx" ON "public"."Lead"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_stage_stageUpdatedAt_setterId_idx" ON "public"."Lead"("stage", "stageUpdatedAt", "setterId");

-- CreateIndex
CREATE INDEX "Lead_stage_stageUpdatedAt_closerId_idx" ON "public"."Lead"("stage", "stageUpdatedAt", "closerId");

-- CreateIndex
CREATE INDEX "Appointment_userId_type_scheduledAt_idx" ON "public"."Appointment"("userId", "type", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_userId_type_status_scheduledAt_idx" ON "public"."Appointment"("userId", "type", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_type_status_scheduledAt_idx" ON "public"."Appointment"("type", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_status_scheduledAt_idx" ON "public"."Appointment"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_leadId_type_scheduledAt_idx" ON "public"."Appointment"("leadId", "type", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_leadId_type_status_scheduledAt_idx" ON "public"."Appointment"("leadId", "type", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_provider_externalId_key" ON "public"."Appointment"("provider", "externalId");

-- CreateIndex
CREATE INDEX "Contract_userId_createdAt_idx" ON "public"."Contract"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_leadId_createdAt_idx" ON "public"."Contract"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Budget_period_weekStart_idx" ON "public"."Budget"("period", "weekStart");

-- CreateIndex
CREATE INDEX "Budget_period_monthStart_idx" ON "public"."Budget"("period", "monthStart");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_userId_day_part_key" ON "public"."Availability"("userId", "day", "part");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalId_key" ON "public"."WebhookEvent"("externalId");

-- CreateIndex
CREATE INDEX "WebhookEvent_type_receivedAt_idx" ON "public"."WebhookEvent"("type", "receivedAt");

-- CreateIndex
CREATE INDEX "CallRequest_leadId_requestedAt_idx" ON "public"."CallRequest"("leadId", "requestedAt");

-- CreateIndex
CREATE INDEX "CallRequest_status_requestedAt_idx" ON "public"."CallRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "CallRequest_createdAt_idx" ON "public"."CallRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CallAttempt_leadId_startedAt_idx" ON "public"."CallAttempt"("leadId", "startedAt");

-- CreateIndex
CREATE INDEX "CallAttempt_userId_startedAt_idx" ON "public"."CallAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "CallAttempt_outcome_startedAt_idx" ON "public"."CallAttempt"("outcome", "startedAt");

-- CreateIndex
CREATE INDEX "CallAttempt_createdAt_idx" ON "public"."CallAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_setterId_fkey" FOREIGN KEY ("setterId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Availability" ADD CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallRequest" ADD CONSTRAINT "CallRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallRequest" ADD CONSTRAINT "CallRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallAttempt" ADD CONSTRAINT "CallAttempt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallAttempt" ADD CONSTRAINT "CallAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallAttempt" ADD CONSTRAINT "CallAttempt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."CallRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
