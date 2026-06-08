import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ tripId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    await requireTripForUser(tripId, user.id);

    const { dayId, itemIds } = await req.json();

    if (!dayId || !Array.isArray(itemIds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.$transaction(
      itemIds.map((id: string, index: number) =>
        prisma.itineraryItem.update({
          where: { id },
          data: { sortOrder: index, dayId },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
