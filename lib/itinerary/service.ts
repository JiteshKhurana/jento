import { prisma } from "@/lib/prisma";
import { buildBookingUrl } from "@/lib/booking/links";
import { resolvePlaceCache } from "@/lib/places/google-places";
import {
  itineraryDraftSchema,
  itemTypeMap,
  type DayPlan,
  type ItineraryDraft,
} from "@/lib/ai/schemas";
import { enrichRoadTripItinerary } from "@/lib/itinerary/road-trip";
import { enrichFlightItinerary } from "@/lib/itinerary/flight";
import { normalizeDayItemTimes } from "@/lib/itinerary/item-times";
import { validateItineraryDayCount } from "@/lib/trips/dates";

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
  const roadTripEnriched = await enrichRoadTripItinerary(
    draft,
    tripContext.preferences,
  );
  const enrichedDraft = await enrichFlightItinerary(
    roadTripEnriched,
    tripContext.preferences,
    tripContext.destination,
  );
  validateItineraryDayCount(
    enrichedDraft.days.length,
    tripContext.startDate,
    tripContext.endDate,
    tripContext.preferences,
  );
  const parsed = itineraryDraftSchema.parse({
    days: enrichedDraft.days.map((day) => ({
      ...day,
      items: normalizeDayItemTimes(day.items),
    })),
  });

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
            estimatedSteps: day.estimatedSteps ?? null,
            fatigueLevel: day.fatigueLevel ?? null,
            cityTransport: day.cityTransport ?? null,
            budgetAccommodation: day.dailyBudgetEstimate?.accommodation ?? null,
            budgetTransport: day.dailyBudgetEstimate?.transport ?? null,
            budgetActivities: day.dailyBudgetEstimate?.activities ?? null,
            budgetFood: day.dailyBudgetEstimate?.food ?? null,
            budgetTotal: day.dailyBudgetEstimate?.total ?? null,
            items: {
              create: await Promise.all(
                day.items.map(async (item, index) => {
                  const resolved = await resolvePlaceCache(
                    item.googlePlaceId,
                    {
                      title: item.title,
                      destination: tripContext.destination,
                      latitude: item.latitude,
                      longitude: item.longitude,
                    },
                    prisma,
                  );
                  const latitude = resolved?.latitude ?? item.latitude;
                  const longitude = resolved?.longitude ?? item.longitude;
                  const googlePlaceId = resolved?.googlePlaceId ?? null;

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
                      website: resolved?.website,
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
    const normalizedItems = normalizeDayItemTimes(dayPlan.items);

    await prisma.itineraryItem.deleteMany({ where: { dayId: existingDay.id } });
    await prisma.itineraryDay.update({
      where: { id: existingDay.id },
      data: {
        title: dayPlan.title,
        summary: dayPlan.summary,
        date: dayPlan.date ? new Date(dayPlan.date) : null,
        estimatedSteps: dayPlan.estimatedSteps ?? null,
        fatigueLevel: dayPlan.fatigueLevel ?? null,
        cityTransport: dayPlan.cityTransport ?? null,
        budgetAccommodation: dayPlan.dailyBudgetEstimate?.accommodation ?? null,
        budgetTransport: dayPlan.dailyBudgetEstimate?.transport ?? null,
        budgetActivities: dayPlan.dailyBudgetEstimate?.activities ?? null,
        budgetFood: dayPlan.dailyBudgetEstimate?.food ?? null,
        budgetTotal: dayPlan.dailyBudgetEstimate?.total ?? null,
        items: {
          create: await Promise.all(
            normalizedItems.map(async (item, index) => {
              const resolved = await resolvePlaceCache(
                item.googlePlaceId,
                {
                  title: item.title,
                  destination: tripContext.destination,
                  latitude: item.latitude,
                  longitude: item.longitude,
                },
                prisma,
              );
              const latitude = resolved?.latitude ?? item.latitude;
              const longitude = resolved?.longitude ?? item.longitude;
              const googlePlaceId = resolved?.googlePlaceId ?? null;

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
                bookingUrl: buildBookingUrl(
                  itemTypeMap[item.type],
                  item.title,
                  {
                    destination: tripContext.destination,
                    startDate: tripContext.startDate,
                    endDate: tripContext.endDate,
                    latitude,
                    longitude,
                    website: resolved?.website,
                  },
                ),
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
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { placeCache: true },
          },
        },
      },
    },
  });
}
