import { prisma } from "@/lib/prisma";
import { buildBookingUrl } from "@/lib/booking/links";
import { getOrFetchPlaceCache } from "@/lib/places/google-places";
import {
  itineraryDraftSchema,
  itemTypeMap,
  type DayPlan,
  type ItineraryDraft,
} from "@/lib/ai/schemas";
import { enrichRoadTripItinerary } from "@/lib/itinerary/road-trip";

export async function saveItineraryToDb(
  tripId: string,
  draft: ItineraryDraft,
  tripContext: {
    destination: string;
    startDate?: Date | null;
    endDate?: Date | null;
    preferences?: unknown;
  },
) {
  const enrichedDraft = await enrichRoadTripItinerary(
    draft,
    tripContext.preferences,
  );
  const parsed = itineraryDraftSchema.parse(enrichedDraft);

  const latest = await prisma.itinerary.findFirst({
    where: { tripId },
    orderBy: { version: "desc" },
  });

  const itinerary = await prisma.itinerary.create({
    data: {
      tripId,
      version: (latest?.version ?? 0) + 1,
      isActive: false,
      days: {
        create: await Promise.all(
          parsed.days.map(async (day) => ({
            dayNumber: day.dayNumber,
            date: day.date ? new Date(day.date) : null,
            title: day.title,
            summary: day.summary,
            items: {
              create: await Promise.all(
                day.items.map(async (item, index) => {
                  let latitude = item.latitude;
                  let longitude = item.longitude;
                  const googlePlaceId = item.googlePlaceId;

                  if (googlePlaceId) {
                    const cached = await getOrFetchPlaceCache(googlePlaceId, prisma);
                    if (cached) {
                      latitude = cached.latitude ?? latitude;
                      longitude = cached.longitude ?? longitude;
                    }
                  }

                  const bookingUrl = buildBookingUrl(
                    itemTypeMap[item.type],
                    item.title,
                    {
                      destination: tripContext.destination,
                      startDate: tripContext.startDate,
                      endDate: tripContext.endDate,
                      latitude,
                      longitude,
                      placeName: item.title,
                    },
                  );

                  return {
                    type: itemTypeMap[item.type],
                    title: item.title,
                    description: item.description,
                    startTime: item.startTime,
                    duration: item.duration,
                    sortOrder: index,
                    latitude,
                    longitude,
                    googlePlaceId,
                    bookingUrl,
                  };
                }),
              ),
            },
          })),
        ),
      },
    },
    include: {
      days: { include: { items: { include: { placeCache: true } } } },
    },
  });

  await prisma.$transaction([
    prisma.itinerary.updateMany({
      where: { tripId, isActive: true },
      data: { isActive: false },
    }),
    prisma.itinerary.update({
      where: { id: itinerary.id },
      data: { isActive: true },
    }),
  ]);

  await prisma.trip.update({
    where: { id: tripId },
    data: { status: "READY" },
  });

  return itinerary;
}

export async function updateItineraryDayInDb(
  tripId: string,
  dayNumber: number,
  dayPlan: DayPlan,
  tripContext: {
    destination: string;
    startDate?: Date | null;
    endDate?: Date | null;
    preferences?: unknown;
  },
) {
  const itinerary = await prisma.itinerary.findFirst({
    where: { tripId, isActive: true },
    include: { days: true },
  });

  if (!itinerary) {
    throw new Error("No active itinerary found");
  }

  const existingDay = itinerary.days.find((d) => d.dayNumber === dayNumber);

  if (existingDay) {
    await prisma.itineraryItem.deleteMany({ where: { dayId: existingDay.id } });
    await prisma.itineraryDay.update({
      where: { id: existingDay.id },
      data: {
        title: dayPlan.title,
        summary: dayPlan.summary,
        date: dayPlan.date ? new Date(dayPlan.date) : null,
        items: {
          create: await Promise.all(
            dayPlan.items.map(async (item, index) => {
              let latitude = item.latitude;
              let longitude = item.longitude;
              const googlePlaceId = item.googlePlaceId;

              if (googlePlaceId) {
                const cached = await getOrFetchPlaceCache(googlePlaceId, prisma);
                if (cached) {
                  latitude = cached.latitude ?? latitude;
                  longitude = cached.longitude ?? longitude;
                }
              }

              return {
                type: itemTypeMap[item.type],
                title: item.title,
                description: item.description,
                startTime: item.startTime,
                duration: item.duration,
                sortOrder: index,
                latitude,
                longitude,
                googlePlaceId,
                bookingUrl: buildBookingUrl(itemTypeMap[item.type], item.title, {
                  destination: tripContext.destination,
                  startDate: tripContext.startDate,
                  endDate: tripContext.endDate,
                  latitude,
                  longitude,
                }),
              };
            }),
          ),
        },
      },
    });
  }

  return prisma.itinerary.findFirst({
    where: { tripId, isActive: true },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" }, include: { placeCache: true } } },
      },
    },
  });
}
