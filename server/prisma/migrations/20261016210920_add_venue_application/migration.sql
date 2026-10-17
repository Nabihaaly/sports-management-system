-- CreateEnum
CREATE TYPE "OwnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "VenueOwnerPersonal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cnic" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "OwnerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueOwnerPersonal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueApplicationDetails" (
    "id" TEXT NOT NULL,
    "venueOwnerId" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "images" TEXT[],
    "businessRegistration" TEXT NOT NULL,
    "sizeOfVenue" TEXT NOT NULL,
    "courtsPriceRange" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueApplicationDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VenueOwnerPersonal_userId_key" ON "VenueOwnerPersonal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueOwnerPersonal_cnic_key" ON "VenueOwnerPersonal"("cnic");

-- AddForeignKey
ALTER TABLE "VenueOwnerPersonal" ADD CONSTRAINT "VenueOwnerPersonal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueApplicationDetails" ADD CONSTRAINT "VenueApplicationDetails_venueOwnerId_fkey" FOREIGN KEY ("venueOwnerId") REFERENCES "VenueOwnerPersonal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
