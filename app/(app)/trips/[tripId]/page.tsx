import { notFound } from "next/navigation";
import { requireCurrentDbUser, getTripById, isTripOwner } from "@/lib/auth";
import { TripPlanner } from "@/components/planner/trip-planner";
import { parseTripPreferences } from "@/lib/trips/preferences";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function TripPage({ params, searchParams }: PageProps) {
  const user = await requireCurrentDbUser().catch(() => null);
  if (!user) notFound();

  const { tripId } = await params;
  const { q } = await searchParams;
  const trip = await getTripById(tripId);
  if (!trip) notFound();

  const owner = isTripOwner(trip, user.id);

  return (
    <TripPlanner
      isOwner={owner}
      initialQuery={owner ? (q ?? null) : null}
      trip={{
        ...trip,
        preferences: parseTripPreferences(trip.preferences),
        startDate: trip.startDate?.toISOString() ?? null,
        endDate: trip.endDate?.toISOString() ?? null,
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
