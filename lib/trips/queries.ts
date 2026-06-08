import { prisma } from "@/lib/prisma";

const tripMetaSelect = {
  id: true,
  title: true,
  destination: true,
  startDate: true,
  endDate: true,
  status: true,
} as const;

const itineraryInclude = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      items: {
        orderBy: { sortOrder: "asc" as const },
        include: { placeCache: true },
      },
    },
  },
} as const;

export async function getTripMetaById(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: tripMetaSelect,
  });
}

export async function getTripMetaForUser(tripId: string, userId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: tripMetaSelect,
  });
}

export async function getTripItineraryById(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) return null;

  return prisma.itinerary.findFirst({
    where: { tripId, isActive: true },
    include: itineraryInclude,
  });
}

export async function getTripItineraryForUser(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: { id: true },
  });
  if (!trip) return null;

  return prisma.itinerary.findFirst({
    where: { tripId, isActive: true },
    include: itineraryInclude,
  });
}
