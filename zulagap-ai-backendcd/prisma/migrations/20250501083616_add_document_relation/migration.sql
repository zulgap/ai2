-- CreateTable
CREATE TABLE "DocumentRelation" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRelation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
