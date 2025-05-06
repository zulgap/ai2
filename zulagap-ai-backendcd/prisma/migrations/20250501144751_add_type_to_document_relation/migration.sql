/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId,type,brandId]` on the table `DocumentRelation` will be added. If there are existing duplicate values, this will fail.
  - Made the column `brandId` on table `DocumentRelation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DocumentRelation" DROP CONSTRAINT "DocumentRelation_brandId_fkey";

-- AlterTable
ALTER TABLE "DocumentRelation" ALTER COLUMN "brandId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRelation_fromId_toId_type_brandId_key" ON "DocumentRelation"("fromId", "toId", "type", "brandId");

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
