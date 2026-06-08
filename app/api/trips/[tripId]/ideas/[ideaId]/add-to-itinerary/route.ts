import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addIdeaToItinerary } from "@/lib/trips/ideas";

type RouteParams = { params: Promise<{ tripId: string; ideaId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, ideaId } = await params;
    const trip = await requireTripForUser(tripId, user.id);

    const body = await req.json();
    const { dayId } = body;

    if (!dayId) {
      return NextResponse.json({ error: "dayId is required" }, { status: 400 });
    }

    const item = await addIdeaToItinerary(tripId, ideaId, dayId, {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });

    if (!item) {
      return NextResponse.json({ error: "Idea or day not found" }, { status: 404 });
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "READY" },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add to itinerary" }, { status: 500 });
  }
}
