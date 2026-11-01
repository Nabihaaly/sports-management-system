/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `PlayerProfile` table. All the data in the column will be lost.
  - Made the column `displayName` on table `PlayerProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `PlayerProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "paymentMethod";

-- AlterTable
ALTER TABLE "PlayerProfile" DROP COLUMN "availability",
ADD COLUMN     "availableForMatching" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "displayName" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "preferredSports" SET DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "PaymentMethod";
