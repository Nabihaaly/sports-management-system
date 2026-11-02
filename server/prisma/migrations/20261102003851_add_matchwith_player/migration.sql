-- CreateTable
CREATE TABLE "matchwithplayers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredSport" TEXT NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3) NOT NULL,
    "budget" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matchwithplayers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matchwithplayers_userId_idx" ON "matchwithplayers"("userId");

-- CreateIndex
CREATE INDEX "matchwithplayers_availableFrom_availableUntil_idx" ON "matchwithplayers"("availableFrom", "availableUntil");
