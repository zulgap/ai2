-- AlterTable
ALTER TABLE "DocumentRelation" ADD COLUMN     "brandId" TEXT;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
