-- AlterTable
ALTER TABLE "WorkflowExecution" ADD COLUMN     "agentSessionId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_agentSessionId_fkey" FOREIGN KEY ("agentSessionId") REFERENCES "AgentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
