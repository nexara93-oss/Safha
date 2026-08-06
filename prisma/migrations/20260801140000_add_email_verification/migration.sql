-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" DATETIME;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
