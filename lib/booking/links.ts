import type { ItemType } from "@/app/generated/prisma/client";
import { getCountryByIATA } from "@/lib/airports/lookup";

type BookingContext = {
  destination: string;
  startDate?: Date | null;
  endDate?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string;
};

/** Format a Date as DD/MM/YYYY for MakeMyTrip itinerary segments */
function formatMMTDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

/**
 * Extract up to two IATA codes from a flight title.
 * Titles are formatted as: "Flight from Name (XYZ) to Name (ABC)"
 */
function extractFlightIATACodes(title: string): [string | null, string | null] {
  const matches = [...title.matchAll(/\(([A-Z]{3})\)/g)];
  if (matches.length < 2) return [null, null];
  return [matches[0][1], matches[1][1]];
}

/**
 * Builds a MakeMyTrip flight search URL.
 *
 * - Outbound (isReturn=false): round-trip URL when both dates are available,
 *   otherwise one-way.
 * - Return (isReturn=true): one-way URL using the trip end date.
 * - Falls back to a Google Flights text search when dates are missing.
 */
function buildMMTFlightUrl(
  iata1: string,
  iata2: string,
  isReturn: boolean,
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): string {
  const country1 = getCountryByIATA(iata1);
  const country2 = getCountryByIATA(iata2);
  const intl = country1 && country2 && country1 !== country2 ? "true" : "false";

  const base = "https://www.makemytrip.com/flight/search";
  const pax = "paxType=A-1_C-0_I-0";
  const cabin = "cabinClass=E";
  const lang = "lang=eng";

  if (isReturn) {
    // Return leg: one-way flight on the trip end date (falling back to start date)
    const date = endDate ?? startDate;
    if (!date) {
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${iata1} to ${iata2}`)}`;
    }
    return `${base}?itinerary=${iata1}-${iata2}-${formatMMTDate(date)}&tripType=O&${pax}&intl=${intl}&${cabin}&${lang}`;
  }

  // Outbound leg: round-trip when both dates exist, one-way otherwise
  if (startDate && endDate) {
    const out = formatMMTDate(startDate);
    const ret = formatMMTDate(endDate);
    return `${base}?itinerary=${iata1}-${iata2}-${out}_${iata2}-${iata1}-${ret}&tripType=R&${pax}&intl=${intl}&${cabin}&${lang}`;
  }

  if (startDate) {
    return `${base}?itinerary=${iata1}-${iata2}-${formatMMTDate(startDate)}&tripType=O&${pax}&intl=${intl}&${cabin}&${lang}`;
  }

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${iata1} to ${iata2}`)}`;
}

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
    case "TRANSPORT":
    case "transport":
      if (/^flight from /i.test(title)) {
        const isReturn = /\bback to\b/i.test(title);
        const [iata1, iata2] = extractFlightIATACodes(title);
        if (iata1 && iata2) {
          return buildMMTFlightUrl(
            iata1,
            iata2,
            isReturn,
            ctx.startDate,
            ctx.endDate,
          );
        }
        // IATA codes not found (airport not in lookup table) — fall back to Google Flights
        return `https://www.google.com/travel/flights?q=${encodeURIComponent(title)}`;
      }
      if (ctx.latitude && ctx.longitude) {
        return `https://www.google.com/maps/dir/?api=1&destination=${ctx.latitude},${ctx.longitude}`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}
