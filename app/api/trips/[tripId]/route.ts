import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTripMetaById } from "@/lib/trips/queries";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { tripId } = await params;
  const trip = await getTripMetaById(tripId);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    const body = await req.json();
    const { title, destination, startDate, endDate, preferences } = body;

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(title !== undefined && { title }),
        ...(destination !== undefined && { destination }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(preferences !== undefined && { preferences }),
      },
    });

    return NextResponse.json(trip);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    await prisma.trip.delete({ where: { id: tripId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
