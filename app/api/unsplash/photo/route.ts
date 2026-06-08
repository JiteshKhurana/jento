import { NextResponse } from "next/server";
import { requireCurrentDbUser } from "@/lib/auth";
import { getUnsplashPhoto } from "@/lib/unsplash/photos";

export async function GET(req: Request) {
  try {
    await requireCurrentDbUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() ?? "";

    const photo = await getUnsplashPhoto(query);
    if (!photo) {
      return NextResponse.json({ error: "Photo not available" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}
