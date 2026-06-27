"use client";

import { useState } from "react";
import { Map as MapIcon, Search } from "lucide-react";
import { ExploreView } from "@/components/explore/explore-view";
import { cn } from "@/lib/utils";
import type { TripOption } from "@/components/explore/add-to-trip-picker";

type ExploreLocation = {
  name: string;
  label: string;
  latitude?: number;
  longitude?: number;
};

type ExplorePageViewProps = {
  isSignedIn: boolean;
  trips: TripOption[];
  initialSavedIds: string[];
  defaultLocation: ExploreLocation;
};

export function ExplorePageView({
  isSignedIn,
  trips,
  initialSavedIds,
  defaultLocation,
}: ExplorePageViewProps) {
  const [mobileView, setMobileView] = useState<"feed" | "map">("feed");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 md:hidden">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Explore
        </h1>
        <div className="mb-3 flex gap-2">
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
      </div>

      <ExploreView
        isSignedIn={isSignedIn}
        trips={trips}
        initialSavedIds={initialSavedIds}
        defaultLocation={defaultLocation}
        mobileView={mobileView}
      />
    </div>
  );
}
