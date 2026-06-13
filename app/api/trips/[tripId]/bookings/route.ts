import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTripMetaById } from "@/lib/trips/queries";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { tripId } = await params;
  const trip = await getTripMetaById(tripId);
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bookings = await prisma.tripBooking.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
