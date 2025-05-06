-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "brandId" TEXT;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
