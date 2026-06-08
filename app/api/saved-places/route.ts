import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import {
  getSavedPlacesForUser,
  savePlaceForUser,
} from "@/lib/saved-places/service";

export async function GET() {
  try {
    const user = await requireCurrentDbUser();
    const places = await getSavedPlacesForUser(user.id);
    return NextResponse.json(places);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireCurrentDbUser();
    const body = await req.json();
    const { title, googlePlaceId, latitude, longitude, locationLabel } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const saved = await savePlaceForUser(user.id, {
      title: title.trim(),
      googlePlaceId,
      latitude,
      longitude,
      locationLabel,
    });

    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Failed to save place" }, { status: 500 });
  }
}
