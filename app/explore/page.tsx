import { auth, currentUser } from "@clerk/nextjs/server";
import { AppHeader } from "@/components/layout/app-header";
import { ExploreView } from "@/components/explore/explore-view";
import { prisma } from "@/lib/prisma";
import { getSavedPlaceIdsForUser } from "@/lib/saved-places/service";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
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
        select: { id: true, title: true, destination: true },
      })
    : [];

  const savedIds = user ? await getSavedPlaceIdsForUser(user.id) : [];
  const recentTrip = trips[0];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <AppHeader />
      <ExploreView
        trips={trips}
        initialSavedIds={savedIds}
        defaultLocation={{
          name: recentTrip?.destination ?? "Paris",
          label: recentTrip?.destination ?? "Paris, France",
        }}
      />
    </div>
  );
}
