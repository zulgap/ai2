/*
  Warnings:

  - Added the required column `brandId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeamLeaderType" AS ENUM ('SINGLE', 'MULTI');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "model" TEXT,
ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "ragDocs" TEXT[],
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "relations" JSONB,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "leaderAgentId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "brandId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "leaderAgentId" TEXT,
ADD COLUMN     "teamLeaderType" "TeamLeaderType" NOT NULL DEFAULT 'SINGLE';

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity" JSONB,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_leaderAgentId_fkey" FOREIGN KEY ("leaderAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_leaderAgentId_fkey" FOREIGN KEY ("leaderAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
