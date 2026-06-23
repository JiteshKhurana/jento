import { generateObject } from "ai";
import { z } from "zod";
import { gemmaStructuredModel } from "@/lib/ai/gemma-structured";
import { getGeminiApiKey } from "@/lib/env";
import { MAX_TRIP_DAYS } from "@/lib/trips/dates";
import type { RecommendedDaysInput } from "@/lib/trips/recommended-days";

export type RecommendedBudgetLocation = RecommendedDaysInput & {
  latitude?: string;
  longitude?: string;
};

export type RecommendedBudgetDeparture = RecommendedBudgetLocation;

export type RecommendedBudgetInput = {
  destinations: RecommendedBudgetLocation[];
  departure?: RecommendedBudgetDeparture | null;
  days: number;
  currency: string;
  isRoadTrip?: boolean;
};

export type RecommendedBudgetResult = {
  minAmount: number;
  maxAmount: number;
  summary: string;
};

const SUMMARY_MAX_LENGTH = 140;

const recommendedBudgetSchema = z
  .object({
    minAmount: z
      .number()
      .int()
      .min(1)
      .describe(
        "Budget-conscious total per person (hostels/budget stays, street food, free or low-cost sights)",
      ),
    maxAmount: z
      .number()
      .int()
      .min(1)
      .describe(
        "Luxury total per person (premium hotels, fine dining, premium experiences and transport)",
      ),
    summary: z
      .string()
      .describe(
        "One short sentence (under 140 characters) explaining the budget-to-luxury range",
      ),
  })
  .refine((data) => data.maxAmount >= data.minAmount, {
    message: "maxAmount must be greater than or equal to minAmount",
  });

function normalizeSummary(summary: string): string {
  const trimmed = summary.trim();
  if (trimmed.length <= SUMMARY_MAX_LENGTH) return trimmed;

  const truncated = trimmed.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > SUMMARY_MAX_LENGTH * 0.6) {
    return `${truncated.slice(0, lastSpace)}…`;
  }
  return `${truncated}…`;
}

const SAME_AREA_RADIUS_KM = 50;
const ROAD_DISTANCE_FACTOR = 1.25;

function clampAmount(amount: number): number {
  return Math.max(1, Math.round(amount));
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function parseCoords(location: {
  latitude?: string;
  longitude?: string;
}): { lat: number; lng: number } | null {
  const lat = location.latitude ? Number.parseFloat(location.latitude) : NaN;
  const lng = location.longitude ? Number.parseFloat(location.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function locationCountryCode(location: RecommendedDaysInput): string | null {
  if (location.countryCode) return location.countryCode.toUpperCase();
  const parts = location.label.split(",").map((part) => part.trim());
  const last = parts.at(-1);
  if (!last) return null;
  if (/^[A-Z]{2}$/.test(last)) return last;
  return null;
}

function isDomesticTrip(
  departure: RecommendedBudgetDeparture,
  destinations: RecommendedBudgetLocation[],
): boolean {
  const departureCountry = locationCountryCode(departure);
  if (!departureCountry) return false;
  return destinations.every((destination) => {
    const country = locationCountryCode(destination);
    return !country || country === departureCountry;
  });
}

function estimateRoadDistanceKm(
  departure: RecommendedBudgetDeparture,
  destinations: RecommendedBudgetLocation[],
): number {
  const departureCoords = parseCoords(departure);
  if (!departureCoords) {
    return 350 + Math.max(0, destinations.length - 1) * 180;
  }

  let total = 0;
  let previous = departureCoords;

  for (const destination of destinations) {
    const destinationCoords = parseCoords(destination);
    if (destinationCoords) {
      total += haversineKm(previous, destinationCoords) * ROAD_DISTANCE_FACTOR;
      previous = destinationCoords;
    } else {
      total += 250;
    }
  }

  return total;
}

function estimateFuelCost(currency: string, distanceKm: number): number {
  const costPerKm: Record<string, number> = {
    INR: 8,
    USD: 0.14,
    EUR: 0.13,
    GBP: 0.12,
    JPY: 20,
    AUD: 0.2,
    CAD: 0.18,
    SGD: 0.18,
  };

  const rate = costPerKm[currency] ?? costPerKm.USD;
  return clampAmount(distanceKm * rate);
}

function estimateFlightCost(
  currency: string,
  distanceKm: number,
  domestic: boolean,
): number {
  if (distanceKm <= SAME_AREA_RADIUS_KM) return 0;

  const perKm: Record<string, { domestic: number; international: number }> = {
    INR: { domestic: 7, international: 12 },
    USD: { domestic: 0.12, international: 0.18 },
    EUR: { domestic: 0.11, international: 0.17 },
    GBP: { domestic: 0.1, international: 0.16 },
    JPY: { domestic: 18, international: 28 },
    AUD: { domestic: 0.16, international: 0.22 },
    CAD: { domestic: 0.14, international: 0.2 },
    SGD: { domestic: 0.15, international: 0.21 },
  };

  const rates = perKm[currency] ?? perKm.USD;
  const rate = domestic ? rates.domestic : rates.international;
  const base = domestic ? 2500 : 8000;
  const baseByCurrency: Record<string, number> = {
    INR: base,
    USD: domestic ? 80 : 250,
    EUR: domestic ? 70 : 220,
    GBP: domestic ? 65 : 200,
    JPY: domestic ? 9000 : 28000,
    AUD: domestic ? 110 : 320,
    CAD: domestic ? 100 : 280,
    SGD: domestic ? 100 : 300,
  };

  const minimum = baseByCurrency[currency] ?? baseByCurrency.USD;
  return clampAmount(Math.max(minimum, distanceKm * rate));
}

function estimateTransportCost(input: RecommendedBudgetInput): number {
  if (!input.departure || input.destinations.length === 0) return 0;

  const firstDestination = input.destinations[0];
  const departureCoords = parseCoords(input.departure);
  const destinationCoords = parseCoords(firstDestination);

  if (input.isRoadTrip) {
    return estimateFuelCost(
      input.currency,
      estimateRoadDistanceKm(input.departure, input.destinations),
    );
  }

  let distanceKm = 800;
  if (departureCoords && destinationCoords) {
    distanceKm = haversineKm(departureCoords, destinationCoords);
  }

  return estimateFlightCost(
    input.currency,
    distanceKm,
    isDomesticTrip(input.departure, input.destinations),
  );
}

type DailyRateTier = "low" | "mid" | "high";

function fallbackDailyRate(
  currency: string,
  destinations: RecommendedBudgetLocation[],
  tier?: DailyRateTier,
): number {
  const label = destinations
    .map((d) => d.label)
    .join(" ")
    .toLowerCase();

  const isHighCost =
    /\b(japan|switzerland|norway|denmark|iceland|singapore|australia|united kingdom|uk|france|italy|spain|usa|united states|new york|london|paris|tokyo)\b/.test(
      label,
    );
  const isLowCost =
    /\b(india|vietnam|thailand|indonesia|philippines|nepal|sri lanka|cambodia|laos|mexico|turkey|egypt|morocco)\b/.test(
      label,
    );

  const rates: Record<string, Record<DailyRateTier, number>> = {
    INR: { low: 2500, mid: 4500, high: 9000 },
    USD: { low: 60, mid: 120, high: 250 },
    EUR: { low: 55, mid: 110, high: 230 },
    GBP: { low: 50, mid: 100, high: 200 },
    JPY: { low: 8000, mid: 15000, high: 30000 },
    AUD: { low: 90, mid: 170, high: 350 },
    CAD: { low: 80, mid: 150, high: 300 },
    SGD: { low: 80, mid: 150, high: 300 },
  };

  const resolvedTier =
    tier ?? (isHighCost ? "high" : isLowCost ? "low" : "mid");
  return rates[currency]?.[resolvedTier] ?? rates.USD[resolvedTier];
}

function fallbackRecommendedBudget(
  input: RecommendedBudgetInput,
): RecommendedBudgetResult {
  const days = Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(input.days)));
  const budgetDailyRate = fallbackDailyRate(
    input.currency,
    input.destinations,
    "low",
  );
  const luxuryDailyRate = fallbackDailyRate(
    input.currency,
    input.destinations,
    "high",
  );
  const transportCost = estimateTransportCost(input);
  const minAmount = clampAmount(budgetDailyRate * days + transportCost);
  const maxAmount = clampAmount(
    Math.max(minAmount, luxuryDailyRate * days + transportCost),
  );

  const destinationName =
    input.destinations.length === 1
      ? input.destinations[0].name
      : `${input.destinations.length} destinations`;

  const transportNote = input.departure
    ? input.isRoadTrip
      ? "including estimated fuel"
      : transportCost > 0
        ? "including estimated flights"
        : "with minimal travel cost"
    : "before travel to the destination";

  return {
    minAmount,
    maxAmount,
    summary: normalizeSummary(
      `Budget to luxury range for ${days} days in ${destinationName}, ${transportNote}.`,
    ),
  };
}

function buildDeparturePromptLine(
  departure: RecommendedBudgetDeparture | null | undefined,
): string {
  if (!departure) return "Departing from: not specified";
  return `Departing from: ${departure.label || departure.name}`;
}

export async function getRecommendedBudget(
  input: RecommendedBudgetInput,
): Promise<RecommendedBudgetResult | null> {
  if (input.destinations.length === 0 || input.days < 1) return null;

  const days = Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(input.days)));
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.log(
      "[recommended-budget] Using fallback calculation (no Gemini API key)",
    );
    return fallbackRecommendedBudget({ ...input, days });
  }

  const destinationList = input.destinations
    .map((destination) => `- ${destination.label || destination.name}`)
    .join("\n");

  const transportRule = input.isRoadTrip
    ? "Include realistic fuel costs for driving from the departure point through all stops."
    : "Include realistic round-trip airfare from the departure point to the destination area.";

  try {
    const { object } = await generateObject({
      model: gemmaStructuredModel(),
      schema: recommendedBudgetSchema,
      temperature: 0,
      system: `You are an expert travel planner recommending a realistic per-person trip budget range.

Rules:
- Return minAmount and maxAmount as totals per person for the full trip (not per day), in ${input.currency}.
- minAmount: budget-conscious travel — hostels or budget hotels, street food and casual meals, free or low-cost sights, public transport.
- maxAmount: luxury travel — premium hotels, fine dining, premium experiences, private or premium transport where typical.
- maxAmount must be greater than or equal to minAmount.
- ${transportRule}
- Add on-trip spending on top of transport for both tiers (budget tier uses economy transport; luxury tier may include premium options).
- Both amounts must be positive whole numbers in ${input.currency}.
- For multi-destination trips, include inter-city transport within the trip.
- summary must be one concise sentence under 140 characters describing the budget-to-luxury range.`,
      prompt: `${buildDeparturePromptLine(input.departure)}

Destinations:
${destinationList}

Trip length: ${days} days
Currency: ${input.currency}
Trip style: ${input.isRoadTrip ? "road trip with multiple stops" : input.destinations.length > 1 ? "multi-city trip" : "single-city trip"}

What budget-to-luxury range per person do you recommend (minAmount to maxAmount)?`,
    });

    console.log("[recommended-budget] Using AI recommendation (Gemma 4 31B)");

    const minAmount = clampAmount(object.minAmount);
    const maxAmount = clampAmount(Math.max(minAmount, object.maxAmount));

    return {
      minAmount,
      maxAmount,
      summary: normalizeSummary(object.summary),
    };
  } catch (err) {
    console.log(
      "[recommended-budget] Using fallback calculation (AI request failed)",
      err,
    );
    return fallbackRecommendedBudget({ ...input, days });
  }
}

export function formatRecommendedBudgetPlaceholder(
  result: RecommendedBudgetResult,
): string {
  return `Recommended: ${result.minAmount.toLocaleString()} - ${result.maxAmount.toLocaleString()}`;
}
