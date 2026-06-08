import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ tripId: string; itemId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, itemId } = await params;
    await requireTripForUser(tripId, user.id);

    const item = await prisma.itineraryItem.findFirst({
      where: {
        id: itemId,
        day: { itinerary: { tripId, isActive: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.type !== undefined && { type: body.type }),
      },
      include: { placeCache: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, itemId } = await params;
    await requireTripForUser(tripId, user.id);

    const item = await prisma.itineraryItem.findFirst({
      where: {
        id: itemId,
        day: { itinerary: { tripId, isActive: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.itineraryItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
