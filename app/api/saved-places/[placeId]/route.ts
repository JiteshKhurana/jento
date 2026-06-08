import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { unsavePlaceForUser } from "@/lib/saved-places/service";

type RouteParams = { params: Promise<{ placeId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { placeId } = await params;
    await unsavePlaceForUser(user.id, placeId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to unsave place" }, { status: 500 });
  }
}
