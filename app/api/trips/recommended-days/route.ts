import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentDbUser } from "@/lib/auth";
import { getRecommendedDays } from "@/lib/trips/recommended-days";

const bodySchema = z.object({
  destinations: z
    .array(
      z.object({
        name: z.string().min(1),
        label: z.string().min(1),
        countryCode: z.string().optional(),
      }),
    )
    .min(1)
    .max(8),
  isRoadTrip: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireCurrentDbUser();

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const recommendation = await getRecommendedDays(
      parsed.data.destinations,
      parsed.data.isRoadTrip ?? false,
    );

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
    console.error("Recommended days error:", err);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 },
    );
  }
}
