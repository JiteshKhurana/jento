import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary/client";

type RouteParams = { params: Promise<{ tripId: string; bookingId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, bookingId } = await params;
    await requireTripForUser(tripId, user.id);

    const booking = await prisma.tripBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tripId !== tripId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove from Cloudinary if configured
    if (isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(booking.cloudinaryId, {
          resource_type: booking.resourceType as "image" | "raw" | "video",
        });
      } catch (err) {
        console.warn("[bookings/delete] Cloudinary destroy failed:", err);
      }
    }

    await prisma.tripBooking.delete({ where: { id: bookingId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, bookingId } = await params;
    await requireTripForUser(tripId, user.id);

    const booking = await prisma.tripBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tripId !== tripId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, notes } = body;

    const updated = await prisma.tripBooking.update({
      where: { id: bookingId },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
