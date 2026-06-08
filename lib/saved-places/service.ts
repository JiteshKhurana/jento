import { prisma } from "@/lib/prisma";
import { getOrFetchPlaceCache } from "@/lib/places/google-places";
import { toStoragePlaceId } from "@/lib/places/utils";

export type SavePlaceInput = {
  title: string;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
};

export async function getSavedPlacesForUser(userId: string) {
  return prisma.savedPlace.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { placeCache: true },
  });
}

export async function getSavedPlaceIdsForUser(userId: string) {
  const rows = await prisma.savedPlace.findMany({
    where: { userId, googlePlaceId: { not: null } },
    select: { googlePlaceId: true },
  });
  return rows.map((row) => row.googlePlaceId!).filter(Boolean);
}

export async function savePlaceForUser(userId: string, input: SavePlaceInput) {
  let googlePlaceId: string | undefined;

  if (input.googlePlaceId) {
    const cached = await getOrFetchPlaceCache(input.googlePlaceId, prisma);
    if (cached) {
      googlePlaceId = cached.googlePlaceId;
    } else {
      googlePlaceId = toStoragePlaceId(input.googlePlaceId);
      await prisma.placeCache.upsert({
        where: { googlePlaceId },
        update: {
          name: input.title,
          ...(input.latitude != null && { latitude: input.latitude }),
          ...(input.longitude != null && { longitude: input.longitude }),
        },
        create: {
          googlePlaceId,
          name: input.title,
          latitude: input.latitude,
          longitude: input.longitude,
          photos: [],
          reviews: [],
        },
      });
    }
  }

  if (googlePlaceId) {
    return prisma.savedPlace.upsert({
      where: { userId_googlePlaceId: { userId, googlePlaceId } },
      update: {
        title: input.title,
        latitude: input.latitude,
        longitude: input.longitude,
        locationLabel: input.locationLabel,
      },
      create: {
        userId,
        googlePlaceId,
        title: input.title,
        latitude: input.latitude,
        longitude: input.longitude,
        locationLabel: input.locationLabel,
      },
      include: { placeCache: true },
    });
  }

  return prisma.savedPlace.create({
    data: {
      userId,
      title: input.title,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
    },
    include: { placeCache: true },
  });
}

export async function unsavePlaceForUser(
  userId: string,
  googlePlaceId: string,
) {
  const storageId = toStoragePlaceId(googlePlaceId);
  return prisma.savedPlace.deleteMany({
    where: { userId, googlePlaceId: storageId },
  });
}
