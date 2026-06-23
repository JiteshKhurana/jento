import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, stepCountIs } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { resolveTripGroundingLatLng } from "@/lib/ai/grounding";
import { prisma } from "@/lib/prisma";
import { getGeminiApiKey } from "@/lib/env";
import { resolvePlaceCache } from "@/lib/places/google-places";
import { buildBookingUrl } from "@/lib/booking/links";
import type { ItemType } from "@/app/generated/prisma/client";

export const maxDuration = 30;

type RouteParams = { params: Promise<{ tripId: string; itemId: string }> };

const alternativeSchema = z.object({
  title: z.string(),
  description: z.string(),
  googlePlaceId: z
    .string()
    .optional()
    .describe(
      "Copy maps.placeId exactly from google_maps grounding metadata when available",
    ),
});

function extractJsonObject(text: string): unknown {
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] ?? stripped);
}

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId, itemId } = await params;
    const trip = await requireTripForUser(tripId, user.id);

    if (!getGeminiApiKey()) {
      return NextResponse.json(
        { error: "AI suggestions are not available" },
        { status: 503 },
      );
    }

    const item = await prisma.itineraryItem.findFirst({
      where: {
        id: itemId,
        day: { itinerary: { tripId, isActive: true } },
      },
      include: {
        day: {
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const otherTitles = item.day.items
      .filter((i) => i.id !== itemId)
      .map((i) => i.title);

    const groundingLatLng = await resolveTripGroundingLatLng(trip);
    const googleProviderOptions: GoogleLanguageModelOptions = {};
    if (groundingLatLng) {
      googleProviderOptions.retrievalConfig = { latLng: groundingLatLng };
    }

    const { text } = await generateText({
      model: google("gemini-3.1-flash-lite"),
      tools: {
        google_maps: google.tools.googleMaps({}),
      },
      stopWhen: stepCountIs(5),
      providerOptions: {
        google: googleProviderOptions satisfies GoogleLanguageModelOptions,
      },
      system:
        "You are a travel planner. Use google_maps to discover real venues at the destination. " +
        "After grounding, respond with ONLY a valid JSON object — no markdown, no prose, no code fences. " +
        'Include googlePlaceId copied exactly from google_maps grounding metadata (maps.placeId) when available. ' +
        'Example: {"title": "Place Name", "description": "Why it is a great alternative.", "googlePlaceId": "ChIJ..."}',
      prompt:
        `Suggest ONE alternative to replace this itinerary item for a trip to ${trip.destination}:\n` +
        `- Current item: ${item.title} (${item.type.toLowerCase()})\n` +
        (item.description ? `- Description: ${item.description}\n` : "") +
        (otherTitles.length > 0
          ? `- Already planned this day (do NOT suggest these): ${otherTitles.join(", ")}\n`
          : "") +
        `\nUse google_maps to find a real alternative ${item.type.toLowerCase()} ` +
        `in or near ${trip.destination} that serves a similar purpose but offers a different experience.\n` +
        `Return ONLY: {"title": "...", "description": "...", "googlePlaceId": "..."}`,
    });

    const alternative = alternativeSchema.parse(extractJsonObject(text));

    const resolved = await resolvePlaceCache(
      alternative.googlePlaceId,
      { title: alternative.title, destination: trip.destination },
      prisma,
    );

    const googlePlaceId = resolved?.googlePlaceId ?? null;
    const latitude = resolved?.latitude ?? null;
    const longitude = resolved?.longitude ?? null;

    const bookingUrl = buildBookingUrl(item.type as ItemType, alternative.title, {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      latitude,
      longitude,
      placeName: alternative.title,
      website: resolved?.website,
    });

    const updated = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        title: alternative.title,
        description: alternative.description,
        googlePlaceId,
        latitude,
        longitude,
        bookingUrl,
      },
      include: { placeCache: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (err.message === "Trip not found") {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }
    }
    console.error("[suggest-alternative] failed:", err);
    return NextResponse.json(
      { error: "Failed to suggest alternative" },
      { status: 500 },
    );
  }
}
