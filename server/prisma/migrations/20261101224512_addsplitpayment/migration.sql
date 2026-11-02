-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('SINGLE', 'SPLIT');

-- CreateEnum
CREATE TYPE "SplitBookingStatus" AS ENUM ('INVITING', 'READY_FOR_PAYMENT');

-- CreateEnum
CREATE TYPE "BookingInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ParticipantPaymentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingType" "BookingType" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "invitationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "splitStatus" "SplitBookingStatus";

-- CreateTable
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "invitationStatus" "BookingInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "amountPKR" INTEGER NOT NULL,
    "paymentStatus" "ParticipantPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingParticipant_userId_invitationStatus_idx" ON "BookingParticipant"("userId", "invitationStatus");

-- CreateIndex
CREATE INDEX "BookingParticipant_bookingId_invitationStatus_idx" ON "BookingParticipant"("bookingId", "invitationStatus");

-- CreateIndex
CREATE INDEX "BookingParticipant_bookingId_paymentStatus_idx" ON "BookingParticipant"("bookingId", "paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BookingParticipant_bookingId_userId_key" ON "BookingParticipant"("bookingId", "userId");

-- CreateIndex
CREATE INDEX "Booking_bookingType_splitStatus_idx" ON "Booking"("bookingType", "splitStatus");

-- CreateIndex
CREATE INDEX "Booking_invitationExpiresAt_idx" ON "Booking"("invitationExpiresAt");

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingParticipant" ADD CONSTRAINT "BookingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
