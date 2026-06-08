import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { searchPlaces } from "@/lib/places/google-places";

export async function GET(req: Request) {
  try {
    await requireCurrentDbUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const location = searchParams.get("location") ?? undefined;

    if (!q) {
      return NextResponse.json({ error: "q is required" }, { status: 400 });
    }

    const results = await searchPlaces(q, location);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
