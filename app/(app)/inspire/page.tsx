import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { InspireView } from "@/components/inspire/inspire-view";
import {
  FEATURED_DESTINATIONS,
  ITINERARY_TEMPLATES,
} from "@/lib/inspire/templates";
import { getUnsplashPhoto } from "@/lib/unsplash/photos";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";

export const revalidate = 86400;

export const metadata = {
  title: "Inspiration — Jento",
  description:
    "Browse popular destinations and ready-made itineraries. One click to start planning your next adventure.",
};

export default async function InspirePage() {
  const { userId } = await auth();

  const [destinationPhotosArr, templatePhotosArr] = await Promise.all([
    Promise.all(
      FEATURED_DESTINATIONS.map((d) => getUnsplashPhoto(d.unsplashQuery)),
    ),
    Promise.all(
      ITINERARY_TEMPLATES.map((t) => getUnsplashPhoto(t.unsplashQuery)),
    ),
  ]);

  const destinationPhotos: Record<string, UnsplashPhoto | null> = {};
  FEATURED_DESTINATIONS.forEach((d, i) => {
    destinationPhotos[d.id] = destinationPhotosArr[i];
  });

  const templatePhotos: Record<string, UnsplashPhoto | null> = {};
  ITINERARY_TEMPLATES.forEach((t, i) => {
    templatePhotos[t.id] = templatePhotosArr[i];
  });

  return (
    <AppShell>
      <InspireView
        destinationPhotos={destinationPhotos}
        templatePhotos={templatePhotos}
        signedIn={!!userId}
      />
    </AppShell>
  );
}
