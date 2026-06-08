-- CreateTable
CREATE TABLE "TripIdea" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "type" "ItemType" NOT NULL DEFAULT 'ACTIVITY',
    "googlePlaceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripIdea_tripId_idx" ON "TripIdea"("tripId");

-- AddForeignKey
ALTER TABLE "TripIdea" ADD CONSTRAINT "TripIdea_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripIdea" ADD CONSTRAINT "TripIdea_googlePlaceId_fkey" FOREIGN KEY ("googlePlaceId") REFERENCES "PlaceCache"("googlePlaceId") ON DELETE SET NULL ON UPDATE CASCADE;
