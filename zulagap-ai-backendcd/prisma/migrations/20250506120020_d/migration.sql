-- DropForeignKey
ALTER TABLE "DocumentRelation" DROP CONSTRAINT "DocumentRelation_brandId_fkey";

-- AlterTable
ALTER TABLE "DocumentRelation" ALTER COLUMN "brandId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
