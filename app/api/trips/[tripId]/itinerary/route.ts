import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { serializeItinerary } from "@/lib/itinerary/serialize";
import { getTripItineraryById, getTripMetaById } from "@/lib/trips/queries";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;

    const trip = await getTripMetaById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const itinerary = await getTripItineraryById(tripId);
    return NextResponse.json(serializeItinerary(itinerary));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
