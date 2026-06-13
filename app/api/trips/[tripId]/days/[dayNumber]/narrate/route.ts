import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/env";
import { getTripMetaById, getTripItineraryById } from "@/lib/trips/queries";

export const maxDuration = 30;

type RouteParams = { params: Promise<{ tripId: string; dayNumber: string }> };

type DayItem = {
  title: string;
  type: string;
  description: string | null;
  startTime: string | null;
  duration: string | null;
  placeCache: { name: string; address: string | null } | null;
};

function describeItem(item: DayItem) {
  const parts: string[] = [];
  if (item.startTime) parts.push(`${item.startTime} —`);
  parts.push(item.title);
  if (item.duration) parts.push(`(${item.duration})`);
  if (item.description) parts.push(`: ${item.description}`);
  return parts.join(" ");
}

function buildFallbackNarration(
  destination: string,
  day: { dayNumber: number; title: string; summary: string | null; items: DayItem[] },
) {
  const intro = `Here's your plan for day ${day.dayNumber} in ${destination}: ${day.title}.`;
  const summary = day.summary ? ` ${day.summary}.` : "";
  if (day.items.length === 0) {
    return `${intro}${summary} Nothing is scheduled yet — a free day to explore.`;
  }
  const stops = day.items
    .map((item, i) => {
      const time = item.startTime ? `At ${item.startTime}, ` : i === 0 ? "First, " : "Then, ";
      return `${time}${item.title}.`;
    })
    .join(" ");
  return `${intro}${summary} You have ${day.items.length} ${day.items.length === 1 ? "stop" : "stops"} planned. ${stops} Have a great day!`;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { tripId, dayNumber } = await params;

    const trip = await getTripMetaById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const itinerary = await getTripItineraryById(tripId);
    const day = itinerary?.days.find(
      (d) => d.dayNumber === Number(dayNumber),
    );
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    const fallback = buildFallbackNarration(trip.destination, day);

    if (!getGeminiApiKey()) {
      return NextResponse.json({ narration: fallback });
    }

    const itemLines = day.items
      .map((item) => `- ${describeItem(item)} [${item.type.toLowerCase()}]`)
      .join("\n");

    try {
      const { text } = await generateText({
        model: google("gemini-3.1-flash-lite"),
        system:
          "You are a friendly travel companion narrating a day of a trip out loud. " +
          "Write a warm, conversational spoken summary meant to be read by text-to-speech. " +
          "Walk through the day chronologically, mention times when available, and add brief color about the highlights. " +
          "Keep it under 150 words. Plain text only — no markdown, no lists, no emojis, no headings.",
        prompt:
          `Trip destination: ${trip.destination}\n` +
          `Day ${day.dayNumber}: ${day.title}\n` +
          (day.summary ? `Day summary: ${day.summary}\n` : "") +
          `Planned stops:\n${itemLines || "(none scheduled)"}`,
      });

      return NextResponse.json({ narration: text.trim() || fallback });
    } catch {
      return NextResponse.json({ narration: fallback });
    }
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
