"use client";

import { useRouter } from "next/navigation";
import { ExploreSavedNav } from "@/components/explore/explore-saved-nav";
import { SavedView } from "@/components/explore/saved-view";
import type { TripOption } from "@/components/explore/add-to-trip-picker";
import { savedPlacesToSearchResults } from "@/lib/saved-places/utils";

type SavedPlaceRecord = Parameters<
  typeof savedPlacesToSearchResults
>[0][number];

type SavedPageViewProps = {
  trips: TripOption[];
  initialSavedPlaces: SavedPlaceRecord[];
};

export function SavedPageView({ trips, initialSavedPlaces }: SavedPageViewProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 md:px-6 md:py-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:hidden">
          Saved
        </h1>
        <ExploreSavedNav active="saved" />
      </div>

      <SavedView
        trips={trips}
        initialSavedPlaces={initialSavedPlaces}
        onSwitchToExplore={() => router.push("/explore")}
      />
    </div>
  );
}
