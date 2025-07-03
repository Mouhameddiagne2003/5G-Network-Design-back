/*
  Warnings:

  - A unique constraint covering the columns `[projectId,type]` on the table `Result` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Result_projectId_type_key" ON "Result"("projectId", "type");
