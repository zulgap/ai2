-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "workerAgentId" TEXT;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_workerAgentId_fkey" FOREIGN KEY ("workerAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
