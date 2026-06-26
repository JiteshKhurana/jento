"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Map as MapIcon, Search } from "lucide-react";
import { ExploreSavedNav } from "@/components/explore/explore-saved-nav";
import { SavedView } from "@/components/explore/saved-view";
import { cn } from "@/lib/utils";
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
  const [mobileView, setMobileView] = useState<"feed" | "map">("feed");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 md:px-6 md:py-3">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:hidden">
          Saved
        </h1>
        <div className="mb-3 flex gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("feed")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
              mobileView === "feed"
                ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
                : "text-muted-foreground",
            )}
          >
            <Search className="h-4 w-4" />
            List view
          </button>
          <button
            type="button"
            onClick={() => setMobileView("map")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
              mobileView === "map"
                ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
                : "text-muted-foreground",
            )}
          >
            <MapIcon className="h-4 w-4" />
            Map view
          </button>
        </div>
        <ExploreSavedNav active="saved" />
      </div>

      <SavedView
        trips={trips}
        initialSavedPlaces={initialSavedPlaces}
        mobileView={mobileView}
        onSwitchToExplore={() => router.push("/explore")}
      />
    </div>
  );
}
