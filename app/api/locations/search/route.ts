import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { searchLocations } from "@/lib/locations/search";

export async function GET(req: Request) {
  try {
    await requireCurrentDbUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const results = searchLocations(q, 10);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
