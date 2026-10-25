ALTER TABLE "VenueApplicationDetails"
DROP COLUMN IF EXISTS "adminNote",
DROP COLUMN IF EXISTS "reviewedAt";

ALTER TABLE "VenueOwnerPersonal"
DROP COLUMN IF EXISTS "isVerified",
DROP COLUMN IF EXISTS "verifiedAt";