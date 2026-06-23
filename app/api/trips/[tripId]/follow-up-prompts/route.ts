import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { saveFollowUpPromptsToLastAssistant } from "@/lib/chat/persistence";
import { formatTripDateRange, getExpectedTripDayCount } from "@/lib/trips/dates";
import { parseTripPreferences } from "@/lib/trips/preferences";

type RouteParams = { params: Promise<{ tripId: string }> };

const promptSchema = z.object({
  prompts: z
    .array(
      z.object({
        label: z
          .string()
          .max(30)
          .describe("Short button label, 2–4 words, no punctuation"),
        message: z
          .string()
          .describe("The full message to send to the travel assistant"),
      }),
    )
    .min(2)
    .max(4),
});

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await requireCurrentDbUser();
    const { tripId } = await params;
    const trip = await requireTripForUser(tripId, user.id);

    const {
      hasItinerary,
      recentMessages,
    }: {
      hasItinerary: boolean;
      recentMessages: Array<{ role: string; content: string }>;
    } = await req.json();

    const preferences = parseTripPreferences(trip.preferences);
    const expectedDays = getExpectedTripDayCount(
      trip.startDate,
      trip.endDate,
      trip.preferences,
    );
    const dateRange =
      trip.startDate && trip.endDate
        ? formatTripDateRange(trip.startDate, trip.endDate)
        : expectedDays
          ? `about ${expectedDays} days`
          : null;

    const tripSummary = [
      `Destination: ${trip.destination}`,
      dateRange ? `Dates: ${dateRange}` : null,
      expectedDays ? `Duration: ${expectedDays} days` : null,
      preferences.pace ? `Pace: ${preferences.pace}` : null,
      preferences.dietary ? `Dietary: ${preferences.dietary}` : null,
      preferences.budgetPerPerson
        ? `Budget: ${preferences.budgetPerPerson} ${preferences.budgetCurrency ?? "USD"} per person`
        : null,
      preferences.isRoadTrip ? "Type: Road trip" : null,
      preferences.travelingWithPets ? "Traveling with pets" : null,
      preferences.travelingWithInfants ? "Traveling with infants" : null,
    ]
      .filter(Boolean)
      .join("\n");

    const conversationContext =
      recentMessages.length > 0
        ? recentMessages
            .slice(-6)
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 300)}`,
            )
            .join("\n\n")
        : "No conversation yet.";

    const phase = hasItinerary ? "post-itinerary" : "pre-itinerary";

    const systemPrompt = `You are a travel assistant that generates contextual follow-up prompt suggestions for a trip planning chat.

Given the trip details and recent conversation, generate ${hasItinerary ? "3–4" : "3–4"} short follow-up prompt suggestions that would be genuinely useful and specific to this trip.

Rules:
- Labels must be 2–4 words, no punctuation, title-case (e.g. "Packing Checklist", "Hidden Gems")
- Messages must be specific to the destination and trip context — never generic
- Phase is "${phase}": ${
      hasItinerary
        ? 'itinerary already exists. Focus on enriching the trip: local tips, safety, etiquette, packing, budget, neighbourhoods, day trips, hidden gems, seasonal events, food deep-dives, transport hacks.'
        : 'no itinerary yet. Focus on planning essentials: must-see highlights, best neighbourhoods to stay, local food experiences, or trigger itinerary creation.'
    }
- Do not suggest prompts the user has already asked in the recent conversation
- Each message should be a complete, natural question or request the user would send
- Tailor prompts to destination-specific themes (e.g. for Japan: temples, rail pass; for Italy: gelato, churches; for a beach trip: snorkelling, sunsets)`;

    const userPrompt = `Trip context:\n${tripSummary}\n\nRecent conversation:\n${conversationContext}`;

    const { object } = await generateObject({
      model: google("gemma-4-31b-it"),
      schema: promptSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    await saveFollowUpPromptsToLastAssistant(tripId, object.prompts);

    return NextResponse.json(object);
  } catch (err) {
    console.error("Follow-up prompts error:", err);
    return NextResponse.json(
      { error: "Failed to generate prompts" },
      { status: 500 },
    );
  }
}
