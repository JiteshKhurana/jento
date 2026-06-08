import type { ItemType } from "@/app/generated/prisma/client";

type BookingContext = {
  destination: string;
  startDate?: Date | null;
  endDate?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string;
};

export function buildBookingUrl(
  type: ItemType | string,
  title: string,
  ctx: BookingContext,
): string {
  const query = encodeURIComponent(`${title} ${ctx.destination}`);
  const dest = encodeURIComponent(ctx.destination);

  switch (type) {
    case "LODGING":
    case "lodging": {
      const checkin = ctx.startDate?.toISOString().split("T")[0] ?? "";
      const checkout = ctx.endDate?.toISOString().split("T")[0] ?? "";
      if (checkin && checkout) {
        return `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${checkin}&checkout=${checkout}`;
      }
      return `https://www.booking.com/searchresults.html?ss=${query}`;
    }
    case "FOOD":
    case "food":
      if (ctx.latitude && ctx.longitude) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}&query_place_id=`;
      }
      return `https://www.opentable.com/s?term=${query}`;
    case "ACTIVITY":
    case "activity":
      return `https://www.getyourguide.com/s/?q=${query}`;
    case "TRANSPORT":
    case "transport":
      if (ctx.latitude && ctx.longitude) {
        return `https://www.google.com/maps/dir/?api=1&destination=${ctx.latitude},${ctx.longitude}`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}
