import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SavedPageView } from "@/components/explore/saved-page-view";
import { prisma } from "@/lib/prisma";
import { getSavedPlacesForUser } from "@/lib/saved-places/service";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

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

  if (!user) redirect("/sign-in");

  const [trips, savedPlaces] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, destination: true },
    }),
    getSavedPlacesForUser(user.id),
  ]);

  return (
    <AppShell fullHeight className="overflow-hidden bg-background">
      <SavedPageView trips={trips} initialSavedPlaces={savedPlaces} />
    </AppShell>
  );
}
