import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import {
  buildStaticMapUrl,
  fetchPlacePhoto,
  getOrFetchPlaceCache,
  placeHasPhotos,
} from "@/lib/places/google-places";
import { toStoragePlaceId } from "@/lib/places/utils";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ placeId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await requireCurrentDbUser();
    const { placeId: rawPlaceId } = await params;
    const placeId = toStoragePlaceId(rawPlaceId);
    const { searchParams } = new URL(req.url);
    const index = parseInt(searchParams.get("index") ?? "0", 10);

    const place = await getOrFetchPlaceCache(placeId, prisma);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const photos = place.photos as string[];
    const photoName = photos[index];

    if (photoName && placeHasPhotos(photos)) {
      const buffer = await fetchPlacePhoto(photoName);
      if (buffer) {
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // Fallback: static map thumbnail when Places Photos SKU returns no images
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (mapsKey && place.latitude != null && place.longitude != null) {
      const staticUrl = buildStaticMapUrl(place.latitude, place.longitude, mapsKey);
      const staticRes = await fetch(staticUrl);
      if (staticRes.ok) {
        const buffer = await staticRes.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": staticRes.headers.get("Content-Type") ?? "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    return NextResponse.json({ error: "Photo not available" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}
