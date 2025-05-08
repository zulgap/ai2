-- AlterTable
ALTER TABLE "AgentSession" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkflowExecution" ALTER COLUMN "userId" DROP NOT NULL;
