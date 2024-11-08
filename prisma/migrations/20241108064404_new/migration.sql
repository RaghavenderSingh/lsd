/*
  Warnings:

  - The values [processing] on the enum `StakeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `errorMessage` on the `Stake` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Stake` table. All the data in the column will be lost.
  - You are about to drop the `FailedTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StakeStatus_new" AS ENUM ('pending', 'completed', 'failed');
ALTER TABLE "Stake" ALTER COLUMN "status" TYPE "StakeStatus_new" USING ("status"::text::"StakeStatus_new");
ALTER TYPE "StakeStatus" RENAME TO "StakeStatus_old";
ALTER TYPE "StakeStatus_new" RENAME TO "StakeStatus";
DROP TYPE "StakeStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "Stake_signature_key";

-- AlterTable
ALTER TABLE "Stake" DROP COLUMN "errorMessage",
DROP COLUMN "updatedAt",
ALTER COLUMN "status" SET DEFAULT 'pending';

-- DropTable
DROP TABLE "FailedTransaction";

-- DropEnum
DROP TYPE "FailureType";

-- DropEnum
DROP TYPE "ResolutionStatus";
