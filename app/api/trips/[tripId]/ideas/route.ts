import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { createTripIdea, getTripIdeas } from "@/lib/trips/ideas";
import { getTripMetaById } from "@/lib/trips/queries";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { tripId } = await params;
    const trip = await getTripMetaById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ideas = await getTripIdeas(tripId);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("GET /ideas failed:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    const body = await req.json();
    const { title, notes, type, googlePlaceId, latitude, longitude } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const idea = await createTripIdea(tripId, {
      title: title.trim(),
      notes,
      type,
      googlePlaceId,
      latitude,
      longitude,
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("POST /ideas failed:", error);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
