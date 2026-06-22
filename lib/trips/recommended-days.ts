import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getGeminiApiKey } from "@/lib/env";
import { MAX_TRIP_DAYS } from "@/lib/trips/dates";

export type RecommendedDaysInput = {
  name: string;
  label: string;
  countryCode?: string;
};

export type RecommendedDaysResult = {
  days: number;
  minDays?: number;
  maxDays?: number;
  summary: string;
  perDestination?: Array<{ name: string; days: number }>;
};

const recommendedDaysSchema = z.object({
  days: z
    .number()
    .int()
    .min(1)
    .max(MAX_TRIP_DAYS)
    .describe("Recommended total trip length in days"),
  minDays: z
    .number()
    .int()
    .min(1)
    .max(MAX_TRIP_DAYS)
    .optional()
    .describe("Lower bound when a range is more appropriate"),
  maxDays: z
    .number()
    .int()
    .min(1)
    .max(MAX_TRIP_DAYS)
    .optional()
    .describe("Upper bound when a range is more appropriate"),
  summary: z
    .string()
    .max(140)
    .describe("One short sentence explaining the recommendation"),
  perDestination: z
    .array(
      z.object({
        name: z.string(),
        days: z.number().int().min(1).max(MAX_TRIP_DAYS),
      }),
    )
    .optional()
    .describe("Per-stop breakdown for multi-destination trips"),
});

function clampDays(days: number): number {
  return Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(days)));
}

function fallbackRecommendedDays(
  destinations: RecommendedDaysInput[],
  isRoadTrip: boolean,
): RecommendedDaysResult {
  const perDestination = destinations.map((destination) => ({
    name: destination.name,
    days: clampDays(
      /,\s*[A-Z]{2}$/.test(destination.label) ? 4 : destination.label.includes(",") ? 5 : 7,
    ),
  }));

  const days = clampDays(
    perDestination.reduce((sum, item) => sum + item.days, 0),
  );

  const summary =
    destinations.length === 1
      ? `Most travelers enjoy ${days} days in ${destinations[0].name}.`
      : isRoadTrip
        ? `Allow about ${days} days across these stops on a road trip.`
        : `Plan about ${days} days split across these destinations.`;

  return {
    days,
    perDestination: destinations.length > 1 ? perDestination : undefined,
    summary,
  };
}

function normalizeResult(
  result: z.infer<typeof recommendedDaysSchema>,
  destinations: RecommendedDaysInput[],
): RecommendedDaysResult {
  const days = clampDays(result.days);
  const minDays = result.minDays ? clampDays(result.minDays) : undefined;
  const maxDays = result.maxDays ? clampDays(result.maxDays) : undefined;

  const perDestination =
    destinations.length > 1 && result.perDestination?.length
      ? result.perDestination.map((item) => ({
          name: item.name,
          days: clampDays(item.days),
        }))
      : undefined;

  return {
    days,
    minDays: minDays && minDays < days ? minDays : undefined,
    maxDays: maxDays && maxDays > days ? maxDays : undefined,
    summary: result.summary.trim(),
    perDestination,
  };
}

export async function getRecommendedDays(
  destinations: RecommendedDaysInput[],
  isRoadTrip = false,
): Promise<RecommendedDaysResult | null> {
  if (destinations.length === 0) return null;

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return fallbackRecommendedDays(destinations, isRoadTrip);
  }

  const destinationList = destinations
    .map((destination) => `- ${destination.label || destination.name}`)
    .join("\n");

  try {
    const { object } = await generateObject({
      model: google("gemini-3.1-flash-lite"),
      schema: recommendedDaysSchema,
      system: `You are an expert travel planner recommending how many days to spend at destinations.

Rules:
- Return a realistic recommendation for a first-time visitor with a balanced pace.
- days must be between 1 and ${MAX_TRIP_DAYS}.
- For a single city, recommend how many days to stay in that city.
- For multiple destinations on a road trip, recommend days per stop and a sensible total in days.
- For multiple destinations that are not a road trip, recommend a total trip length and optional per-destination split.
- Use minDays/maxDays only when a tight range is more honest than one number (e.g. 4-6 days).
- summary must be one concise sentence, friendly and practical.`,
      prompt: `Destinations:
${destinationList}

Trip style: ${isRoadTrip ? "road trip with multiple stops" : destinations.length > 1 ? "multi-city trip" : "single-city trip"}

How many days do you recommend?`,
    });

    return normalizeResult(object, destinations);
  } catch {
    return fallbackRecommendedDays(destinations, isRoadTrip);
  }
}

export function formatRecommendedDaysLabel(result: RecommendedDaysResult): string {
  if (result.minDays && result.maxDays && result.minDays !== result.maxDays) {
    return `${result.minDays}–${result.maxDays} days`;
  }
  return `${result.days} ${result.days === 1 ? "day" : "days"}`;
}
