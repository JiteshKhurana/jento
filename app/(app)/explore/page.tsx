import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ExplorePageView } from "@/components/explore/explore-page-view";
import { prisma } from "@/lib/prisma";
import {
  getSavedPlaceIdsForUser,
} from "@/lib/saved-places/service";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ExplorePage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  if (tab === "saved") redirect("/saved");

  const { userId: clerkId } = await auth();
  const isSignedIn = Boolean(clerkId);

  let user = null;
  if (clerkId) {
    user = await prisma.user.findUnique({ where: { clerkId } });

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
    <AppShell fullHeight className="overflow-hidden bg-background">
      <ExplorePageView
        isSignedIn={isSignedIn}
        trips={trips}
        initialSavedIds={savedIds}
        defaultLocation={{
          name: recentTrip?.destination ?? "Paris",
          label: recentTrip?.destination ?? "Paris, France",
        }}
      />
    </AppShell>
  );
}
