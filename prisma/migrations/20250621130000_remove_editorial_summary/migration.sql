-- AlterTable: remove unused editorialSummary from PlaceCache
ALTER TABLE "PlaceCache" DROP COLUMN IF EXISTS "editorialSummary";
