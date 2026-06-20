"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExploreView } from "@/components/explore/explore-view";
import { SavedView } from "@/components/explore/saved-view";
import type { TripOption } from "@/components/explore/add-to-trip-picker";
import { savedPlacesToSearchResults } from "@/lib/saved-places/utils";

type ExploreLocation = {
  name: string;
  label: string;
  latitude?: number;
  longitude?: number;
};

type SavedPlaceRecord = Parameters<
  typeof savedPlacesToSearchResults
>[0][number];

type ExplorePageViewProps = {
  trips: TripOption[];
  initialSavedIds: string[];
  initialSavedPlaces: SavedPlaceRecord[];
  defaultLocation: ExploreLocation;
  initialTab?: "explore" | "saved";
};

export function ExplorePageView({
  trips,
  initialSavedIds,
  initialSavedPlaces,
  defaultLocation,
  initialTab = "explore",
}: ExplorePageViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"explore" | "saved">(initialTab);

  function handleTabChange(value: string) {
    const nextTab = value as "explore" | "saved";
    setTab(nextTab);
    router.replace(
      nextTab === "saved" ? "/explore?tab=saved" : "/explore",
      { scroll: false },
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
        <TabsList>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "explore" ? (
          <ExploreView
            trips={trips}
            initialSavedIds={initialSavedIds}
            defaultLocation={defaultLocation}
          />
        ) : (
          <SavedView
            trips={trips}
            initialSavedPlaces={initialSavedPlaces}
            onSwitchToExplore={() => handleTabChange("explore")}
          />
        )}
      </div>
    </Tabs>
  );
}
