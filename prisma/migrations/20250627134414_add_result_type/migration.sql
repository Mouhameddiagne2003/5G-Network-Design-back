/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `Result` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResultType" AS ENUM ('COVERAGE', 'CAPACITY', 'GNODEB', 'BACKHAUL');

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "ResultType" NOT NULL,
ALTER COLUMN "coverage" DROP NOT NULL,
ALTER COLUMN "capacity" DROP NOT NULL,
ALTER COLUMN "gnodebCount" DROP NOT NULL,
ALTER COLUMN "backhaulCapacity" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Result_projectId_key" ON "Result"("projectId");
