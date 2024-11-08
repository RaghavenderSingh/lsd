/*
  Warnings:

  - A unique constraint covering the columns `[signature]` on the table `Stake` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Stake` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Stake` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StakeStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "FailureType" AS ENUM ('MINT_FAILURE', 'DB_FAILURE');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('NEEDS_RESOLUTION', 'IN_PROGRESS', 'RESOLVED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Stake" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StakeStatus" NOT NULL;

-- CreateTable
CREATE TABLE "FailedTransaction" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "signature" TEXT NOT NULL,
    "type" "FailureType" NOT NULL,
    "status" "ResolutionStatus" NOT NULL,
    "error" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "FailedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FailedTransaction_signature_key" ON "FailedTransaction"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "Stake_signature_key" ON "Stake"("signature");
