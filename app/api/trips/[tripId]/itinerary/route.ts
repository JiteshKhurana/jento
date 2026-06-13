import { NextResponse } from "next/server";
import { serializeItinerary } from "@/lib/itinerary/serialize";
import { getTripItineraryById, getTripMetaById } from "@/lib/trips/queries";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { tripId } = await params;

  const trip = await getTripMetaById(tripId);
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const itinerary = await getTripItineraryById(tripId);
  return NextResponse.json(serializeItinerary(itinerary));
}
