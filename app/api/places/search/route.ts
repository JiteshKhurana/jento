import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { searchPlaces } from "@/lib/places/google-places";
import type { BudgetTier } from "@/lib/trips/intake";

const BUDGET_TIERS = new Set<BudgetTier>(["budget", "moderate", "upscale", "luxury"]);

export async function GET(req: Request) {
  try {
    await requireCurrentDbUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const location = searchParams.get("location") ?? undefined;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const budgetParam = searchParams.get("budget");

    if (!q) {
      return NextResponse.json({ error: "q is required" }, { status: 400 });
    }

    const latitude = lat ? Number.parseFloat(lat) : undefined;
    const longitude = lng ? Number.parseFloat(lng) : undefined;
    const budget =
      budgetParam && BUDGET_TIERS.has(budgetParam as BudgetTier)
        ? (budgetParam as BudgetTier)
        : undefined;

    const results = await searchPlaces(q, {
      location,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      budget,
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
