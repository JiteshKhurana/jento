import { auth, currentUser } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { NewTripButton } from "@/components/trips/new-trip-button";
import { TripCard } from "@/components/trips/trip-card";
import { TripsEmptyState } from "@/components/trips/trips-empty-state";
import { prisma } from "@/lib/prisma";
import { getUnsplashPhoto } from "@/lib/unsplash/photos";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          name: clerkUser.fullName ?? null,
          profileImageUrl: clerkUser.imageUrl ?? null,
        },
      });
    }
  }

  const trips = user
    ? await prisma.trip.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          itineraries: {
            where: { isActive: true },
            include: { days: { include: { items: true } } },
            take: 1,
          },
        },
      })
    : [];

  const tripsWithPhotos = await Promise.all(
    trips.map(async (trip) => ({
      trip,
      coverPhoto: await getUnsplashPhoto(trip.destination),
    })),
  );

  const firstName = user?.name?.split(" ")[0];

  return (
    <AppShell className="bg-mesh">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8 md:py-14">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
              {firstName ? `${firstName}'s trips` : "My trips"}
            </h1>
            <p className="mt-2 max-w-lg text-neutral-500">
              {trips.length > 0
                ? "Pick up where you left off or start planning something new."
                : "Your adventures, all in one place."}
            </p>
          </div>
          {trips.length > 0 && (
            <NewTripButton size="lg" className="cursor-pointer" />
          )}
        </div>

        {trips.length === 0 ? (
          <TripsEmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {tripsWithPhotos.map(({ trip, coverPhoto }) => (
              <TripCard key={trip.id} trip={trip} coverPhoto={coverPhoto} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
