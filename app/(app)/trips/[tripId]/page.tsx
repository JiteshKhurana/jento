import { notFound } from "next/navigation";
import { getCurrentDbUser, getTripById, isTripOwner } from "@/lib/auth";
import { getInitialFollowUpPromptsFromMessages } from "@/lib/chat/follow-up-prompts";
import { TripPlanner } from "@/components/planner/trip-planner";
import { parseTripPreferences } from "@/lib/trips/preferences";
import { parseTripDate } from "@/lib/trips/dates";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function TripPage({ params, searchParams }: PageProps) {
  const { tripId } = await params;
  const { q } = await searchParams;
  const trip = await getTripById(tripId);
  if (!trip) notFound();

  const user = await getCurrentDbUser();
  const owner = user ? isTripOwner(trip, user.id) : false;
  const initialFollowUpPrompts = getInitialFollowUpPromptsFromMessages(
    trip.messages.map((m) => ({
      role: m.role.toLowerCase(),
      metadata: m.metadata,
    })),
  );

  return (
    <TripPlanner
      isOwner={owner}
      initialQuery={owner ? (q ?? null) : null}
      initialFollowUpPrompts={initialFollowUpPrompts}
      trip={{
        ...trip,
        preferences: parseTripPreferences(trip.preferences),
        startDate: trip.startDate
          ? (parseTripDate(trip.startDate)?.toISOString() ?? null)
          : null,
        endDate: trip.endDate
          ? (parseTripDate(trip.endDate)?.toISOString() ?? null)
          : null,
        messages: trip.messages.map((m) => ({
          role: m.role.toLowerCase(),
          content: m.content,
        })),
        itineraries: trip.itineraries.map((it) => ({
          days: it.days.map((day) => ({
            ...day,
            items: day.items.map((item) => ({
              ...item,
              type: item.type,
            })),
          })),
        })),
      }}
    />
  );
}
