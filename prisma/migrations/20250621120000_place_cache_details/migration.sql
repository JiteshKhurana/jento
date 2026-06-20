-- AlterTable: add rich place detail columns to PlaceCache
ALTER TABLE "PlaceCache" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "PlaceCache" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "PlaceCache" ADD COLUMN IF NOT EXISTS "openingHours" JSONB;
ALTER TABLE "PlaceCache" ADD COLUMN IF NOT EXISTS "priceLevel" TEXT;
ALTER TABLE "PlaceCache" ADD COLUMN IF NOT EXISTS "editorialSummary" TEXT;
