-- AlterTable
ALTER TABLE "VenueApplicationDetails" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VenueOwnerPersonal" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
