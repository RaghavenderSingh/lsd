/*
  Warnings:

  - Changed the type of `status` on the `Stake` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StakeStatus" AS ENUM ('pending', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Stake" DROP COLUMN "status",
ADD COLUMN     "status" "StakeStatus" NOT NULL;
