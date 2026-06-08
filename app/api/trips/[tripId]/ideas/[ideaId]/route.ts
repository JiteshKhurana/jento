import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { deleteTripIdea } from "@/lib/trips/ideas";

type RouteParams = { params: Promise<{ tripId: string; ideaId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, ideaId } = await params;
    await requireTripForUser(tripId, user.id);

    const deleted = await deleteTripIdea(tripId, ideaId);
    if (!deleted) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
