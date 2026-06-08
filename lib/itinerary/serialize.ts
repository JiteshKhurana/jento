import type { Prisma } from "@/app/generated/prisma/client";

type ItineraryWithDays = Prisma.ItineraryGetPayload<{
  include: {
    days: {
      include: {
        items: {
          include: { placeCache: true };
        };
      };
    };
  };
}>;

export function serializeItinerary(itinerary: ItineraryWithDays | null) {
  if (!itinerary) {
    return { days: [] as ItineraryWithDays["days"] };
  }

  return {
    id: itinerary.id,
    version: itinerary.version,
    days: itinerary.days.map((day) => ({
      ...day,
      date: day.date?.toISOString() ?? null,
      items: day.items.map((item) => ({
        ...item,
      })),
    })),
  };
}
