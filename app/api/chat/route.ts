import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireCurrentDbUser, requireTripForUser } from "@/lib/auth";
import { resolveTripGroundingLatLng } from "@/lib/ai/grounding";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { dayPlanSchema, itineraryDraftSchema } from "@/lib/ai/schemas";
import { getChatLimitMessage } from "@/lib/chat/limits";
import { isChatLimitReached } from "@/lib/chat/limits-server";
import {
  getAssistantTextFromFinish,
  saveAssistantMessageIfNew,
  saveUserMessageIfNew,
} from "@/lib/chat/persistence";
import {
  saveItineraryToDb,
  updateItineraryDayInDb,
} from "@/lib/itinerary/service";
import { getDrivingDuration } from "@/lib/places/directions";
import { getStartingLocation } from "@/lib/trips/preferences";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireCurrentDbUser();
    const { messages, tripId }: { messages: UIMessage[]; tripId: string } =
      await req.json();

    if (!tripId) {
      return NextResponse.json(
        { error: "tripId is required" },
        { status: 400 },
      );
    }

    const trip = await requireTripForUser(tripId, user.id);
    const tripContext = {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      preferences: trip.preferences,
    };

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      const text =
        lastUserMessage.parts
          ?.filter(
            (p): p is { type: "text"; text: string } => p.type === "text",
          )
          .map((p) => p.text)
          .join("") ?? "";

      if (text) {
        if (await isChatLimitReached(tripId)) {
          return NextResponse.json(
            { error: getChatLimitMessage() },
            { status: 429 },
          );
        }
        await saveUserMessageIfNew(tripId, text);
      }
    }

    const groundingLatLng = await resolveTripGroundingLatLng(trip);
    const googleProviderOptions: GoogleLanguageModelOptions = {};
    if (groundingLatLng) {
      googleProviderOptions.retrievalConfig = { latLng: groundingLatLng };
    }

    const result = streamText({
      model: google("gemini-3.1-flash-lite"),
      system: buildSystemPrompt(trip),
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      providerOptions: {
        google: googleProviderOptions satisfies GoogleLanguageModelOptions,
      },
      tools: {
        google_maps: google.tools.googleMaps({}),
        getDrivingTime: tool({
          description:
            "Get accurate driving time and distance between two locations. Use for road trip itineraries.",
          inputSchema: z.object({
            origin: z
              .string()
              .optional()
              .describe(
                "Starting location. Defaults to the user's current/starting location for road trips.",
              ),
            destination: z
              .string()
              .describe("Ending location, e.g. 'San Antonio, TX'"),
          }),
          execute: async ({ origin, destination }) => {
            const startingLocation = getStartingLocation(trip.preferences);
            const resolvedOrigin =
              origin ??
              startingLocation?.label ??
              startingLocation?.name ??
              null;

            if (!resolvedOrigin) {
              return {
                success: false,
                error:
                  "No starting location available. Ask the user where they are driving from.",
              };
            }

            const route = await getDrivingDuration(resolvedOrigin, destination);
            if (!route) {
              return {
                success: false,
                error: "Could not calculate driving time for those locations.",
              };
            }
            return {
              success: true,
              duration: route.durationText,
              durationMinutes: route.durationMinutes,
              distance: route.distanceText ?? null,
            };
          },
        }),
        saveItinerary: tool({
          description:
            "Save a complete day-by-day itinerary. Every activity, food, and lodging item must include googlePlaceId copied exactly from google_maps grounding metadata (maps.placeId) — never invented or modified.",
          inputSchema: itineraryDraftSchema,
          execute: async (draft) => {
            try {
              const itinerary = await saveItineraryToDb(
                tripId,
                draft,
                tripContext,
              );
              return {
                success: true,
                itineraryId: itinerary.id,
                dayCount: itinerary.days.length,
              };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to save itinerary",
              };
            }
          },
        }),
        updateItineraryDay: tool({
          description:
            "Update or regenerate a specific day. Every activity, food, and lodging item must include googlePlaceId copied exactly from google_maps grounding metadata (maps.placeId) — never invented or modified.",
          inputSchema: z.object({
            dayNumber: z.number().int().min(1),
            day: dayPlanSchema,
          }),
          execute: async ({ dayNumber, day }) => {
            try {
              const itinerary = await updateItineraryDayInDb(
                tripId,
                dayNumber,
                day,
                tripContext,
              );
              return { success: true, dayCount: itinerary?.days.length ?? 0 };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update itinerary day",
              };
            }
          },
        }),
      },
      onFinish: async ({ steps }) => {
        const content = getAssistantTextFromFinish(steps);
        await saveAssistantMessageIfNew(tripId, content);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
