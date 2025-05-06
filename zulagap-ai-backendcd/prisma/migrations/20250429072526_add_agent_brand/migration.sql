-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "brandId" TEXT;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
