import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeminiApiKey } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "missing" | "error"> = {
    database: "missing",
    gemini: getGeminiApiKey() ? "ok" : "missing",
    places: process.env.GOOGLE_PLACES_API_KEY ? "ok" : "missing",
    maps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "ok" : "missing",
    clerk: process.env.CLERK_SECRET_KEY ? "ok" : "missing",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const healthy = checks.database === "ok" && checks.clerk === "ok";

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
