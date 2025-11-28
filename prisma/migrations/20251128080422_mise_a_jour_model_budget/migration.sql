/*
  Warnings:

  - You are about to alter the column `amount` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[period,weekStart]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Budget_period_monthStart_idx";

-- DropIndex
DROP INDEX "public"."Budget_period_weekStart_idx";

-- AlterTable
ALTER TABLE "public"."Budget" ADD COLUMN     "caEncaisse" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_period_weekStart_key" ON "public"."Budget"("period", "weekStart");
