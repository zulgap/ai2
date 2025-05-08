/*
  Warnings:

  - You are about to drop the column `result` on the `NodeResult` table. All the data in the column will be lost.
  - Made the column `workflowExecutionId` on table `Conversation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `NodeResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "agentId" DROP NOT NULL,
ALTER COLUMN "workflowExecutionId" SET NOT NULL,
ALTER COLUMN "nodeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NodeResult" DROP COLUMN "result",
ADD COLUMN     "agentSessionId" TEXT,
ADD COLUMN     "input" JSONB,
ADD COLUMN     "output" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeResult" ADD CONSTRAINT "NodeResult_agentSessionId_fkey" FOREIGN KEY ("agentSessionId") REFERENCES "AgentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
