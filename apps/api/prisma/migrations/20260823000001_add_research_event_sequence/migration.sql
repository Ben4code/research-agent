-- AlterTable
ALTER TABLE "ResearchEvent" ADD COLUMN "sequence" SERIAL NOT NULL;

-- DropIndex
DROP INDEX "ResearchEvent_researchId_timestamp_idx";

-- CreateIndex
CREATE INDEX "ResearchEvent_researchId_sequence_idx" ON "ResearchEvent"("researchId", "sequence");