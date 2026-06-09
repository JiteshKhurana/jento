import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    const bookings = await prisma.tripBooking.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
