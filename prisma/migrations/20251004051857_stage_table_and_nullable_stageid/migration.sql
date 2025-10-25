-- CreateTable: Stage
CREATE TABLE IF NOT EXISTS "public"."Stage" (
  "id"         TEXT         NOT NULL,
  "slug"       TEXT         NOT NULL,
  "label"      TEXT         NOT NULL,
  "order"      INTEGER      NOT NULL DEFAULT 0,
  "color"      TEXT,
  "isWon"      BOOLEAN      NOT NULL DEFAULT false,
  "isClosed"   BOOLEAN      NOT NULL DEFAULT false,
  "isActive"   BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Stage_slug_key" ON "public"."Stage" ("slug");

-- Add stageId (nullable)
ALTER TABLE "public"."Lead" ADD COLUMN IF NOT EXISTS "stageId" TEXT;

-- Index + FK
CREATE INDEX IF NOT EXISTS "Lead_stageId_idx" ON "public"."Lead" ("stageId");
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Lead_stageId_fkey'
  ) THEN
    ALTER TABLE "public"."Lead"
      ADD CONSTRAINT "Lead_stageId_fkey"
      FOREIGN KEY ("stageId") REFERENCES "public"."Stage" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
