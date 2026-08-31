-- AlterTable (idempotent: "sequence" is already created by 20260823000000 on fresh DBs)
ALTER TABLE "ResearchEvent" ADD COLUMN IF NOT EXISTS "sequence" SERIAL NOT NULL;

-- DropIndex (idempotent: the timestamp index only exists on older DBs)
DROP INDEX IF EXISTS "ResearchEvent_researchId_timestamp_idx";

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "ResearchEvent_researchId_sequence_idx" ON "ResearchEvent"("researchId", "sequence");