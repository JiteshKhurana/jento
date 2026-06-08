import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { getOrFetchPlaceCache } from "@/lib/places/google-places";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ placeId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requireCurrentDbUser();
    const { placeId } = await params;
    const place = await getOrFetchPlaceCache(placeId, prisma);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json(place);
  } catch {
    return NextResponse.json({ error: "Failed to fetch place" }, { status: 500 });
  }
}
