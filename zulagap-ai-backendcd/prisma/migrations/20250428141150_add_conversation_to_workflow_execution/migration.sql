-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "workflowExecutionId" TEXT;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
