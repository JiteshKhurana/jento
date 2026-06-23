import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentDbUser } from "@/lib/auth";
import { MAX_TRIP_DAYS } from "@/lib/trips/dates";
import { getRecommendedBudget } from "@/lib/trips/recommended-budget";

const locationSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  countryCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const departureSchema = locationSchema;

const bodySchema = z.object({
  destinations: z.array(locationSchema).min(1).max(8),
  departure: departureSchema.optional(),
  days: z.number().int().min(1).max(MAX_TRIP_DAYS),
  currency: z.string().min(3).max(3),
  isRoadTrip: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireCurrentDbUser();

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const recommendation = await getRecommendedBudget({
      destinations: parsed.data.destinations,
      departure: parsed.data.departure,
      days: parsed.data.days,
      currency: parsed.data.currency,
      isRoadTrip: parsed.data.isRoadTrip ?? false,
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "No recommendation available" },
        { status: 404 },
      );
    }

    return NextResponse.json(recommendation);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Recommended budget error:", err);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 },
    );
  }
}
