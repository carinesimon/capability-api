-- CreateTable
CREATE TABLE "public"."MetricConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetricConfig_key_key" ON "public"."MetricConfig"("key");

-- CreateIndex
CREATE INDEX "MetricConfig_order_idx" ON "public"."MetricConfig"("order");
