/*
  Warnings:

  - Made the column `isPublic` on table `Agent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Agent" ALTER COLUMN "isPublic" SET NOT NULL,
ALTER COLUMN "isPublic" SET DEFAULT true;
