-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "isAgentOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBrandOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTeamOnly" BOOLEAN NOT NULL DEFAULT false;
