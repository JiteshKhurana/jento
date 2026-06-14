import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/locations/search";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const results = await searchLocations(q, 10);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
