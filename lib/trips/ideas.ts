import type { ItemType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildBookingUrl } from "@/lib/booking/links";
import { getOrFetchPlaceCache } from "@/lib/places/google-places";
import { suggestStartTimeForNewItem } from "@/lib/itinerary/item-times";
import { toStoragePlaceId } from "@/lib/places/utils";

export type CreateIdeaInput = {
  title: string;
  notes?: string;
  type?: ItemType;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
};

export async function getTripIdeas(tripId: string) {
  return prisma.tripIdea.findMany({
    where: { tripId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { placeCache: true },
  });
}

async function ensurePlaceCacheForIdea(
  googlePlaceId: string,
  fallback: { title: string; latitude?: number; longitude?: number },
) {
  const cached = await getOrFetchPlaceCache(googlePlaceId, prisma);
  if (cached) return cached;

  const storageId = toStoragePlaceId(googlePlaceId);
  return prisma.placeCache.upsert({
    where: { googlePlaceId: storageId },
    update: {
      name: fallback.title,
      ...(fallback.latitude != null && { latitude: fallback.latitude }),
      ...(fallback.longitude != null && { longitude: fallback.longitude }),
    },
    create: {
      googlePlaceId: storageId,
      name: fallback.title,
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      photos: [],
      reviews: [],
    },
  });
}

export async function createTripIdea(tripId: string, input: CreateIdeaInput) {
  const count = await prisma.tripIdea.count({ where: { tripId } });

  let latitude = input.latitude;
  let longitude = input.longitude;
  let googlePlaceId: string | undefined;

  if (input.googlePlaceId) {
    const cached = await ensurePlaceCacheForIdea(input.googlePlaceId, {
      title: input.title,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    googlePlaceId = cached.googlePlaceId;
    latitude = cached.latitude ?? latitude;
    longitude = cached.longitude ?? longitude;
  }

  return prisma.tripIdea.create({
    data: {
      tripId,
      title: input.title,
      notes: input.notes,
      type: input.type ?? "ACTIVITY",
      googlePlaceId,
      latitude,
      longitude,
      sortOrder: count,
    },
    include: { placeCache: true },
  });
}

export async function deleteTripIdea(tripId: string, ideaId: string) {
  const idea = await prisma.tripIdea.findFirst({
    where: { id: ideaId, tripId },
  });
  if (!idea) return null;

  await prisma.tripIdea.delete({ where: { id: ideaId } });
  return idea;
}

export async function addIdeaToItinerary(
  tripId: string,
  ideaId: string,
  dayId: string,
  tripContext: {
    destination: string;
    startDate?: Date | null;
    endDate?: Date | null;
  },
) {
  const idea = await prisma.tripIdea.findFirst({
    where: { id: ideaId, tripId },
    include: { placeCache: true },
  });
  if (!idea) return null;

  const day = await prisma.itineraryDay.findFirst({
    where: {
      id: dayId,
      itinerary: { tripId, isActive: true },
    },
    include: { items: true },
  });
  if (!day) return null;

  const { startTime, duration } = suggestStartTimeForNewItem(day.items, {
    type: idea.type,
    title: idea.title,
  });

  const bookingUrl = buildBookingUrl(idea.type, idea.title, {
    destination: tripContext.destination,
    startDate: tripContext.startDate,
    endDate: tripContext.endDate,
    latitude: idea.latitude,
    longitude: idea.longitude,
    placeName: idea.title,
    website: idea.placeCache?.website,
  });

  const item = await prisma.itineraryItem.create({
    data: {
      dayId: day.id,
      type: idea.type,
      title: idea.title,
      description: idea.notes,
      startTime,
      duration,
      sortOrder: day.items.length,
      latitude: idea.latitude,
      longitude: idea.longitude,
      googlePlaceId: idea.googlePlaceId,
      bookingUrl,
    },
    include: { placeCache: true },
  });

  return item;
}
