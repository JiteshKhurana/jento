"use client";

import { useRouter } from "next/navigation";
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
      <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 md:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Saved
        </h1>
      </div>

      <SavedView
        trips={trips}
        initialSavedPlaces={initialSavedPlaces}
        onSwitchToExplore={() => router.push("/explore")}
      />
    </div>
  );
}
