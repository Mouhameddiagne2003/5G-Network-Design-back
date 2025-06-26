/*
  Warnings:

  - Changed the type of `zoneType` on the `Project` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('URBAIN', 'PERI_URBAIN', 'RURAL');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('EMBB', 'URLLC', 'MMTC');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "antennaHeight" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "power" DOUBLE PRECISION NOT NULL DEFAULT 43.0,
ADD COLUMN     "services" "ServiceType"[],
ADD COLUMN     "userHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
DROP COLUMN "zoneType",
ADD COLUMN     "zoneType" "ZoneType" NOT NULL;
