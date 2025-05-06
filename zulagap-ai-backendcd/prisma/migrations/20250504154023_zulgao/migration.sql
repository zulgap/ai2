/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId,type,brandId,agentId,teamId,workflowId,nodeId]` on the table `DocumentRelation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DocumentRelation_fromId_toId_type_brandId_key";

-- AlterTable
ALTER TABLE "DocumentRelation" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "nodeId" TEXT,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "workflowId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRelation_fromId_toId_type_brandId_agentId_teamId_wo_key" ON "DocumentRelation"("fromId", "toId", "type", "brandId", "agentId", "teamId", "workflowId", "nodeId");

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;
