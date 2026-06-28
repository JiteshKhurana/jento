"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PlaceSearchResult } from "@/lib/places/google-places";

export type TripOption = {
  id: string;
  title: string;
  destination: string;
};

type AddToTripPickerProps = {
  place: PlaceSearchResult;
  trips: TripOption[];
  addedTripIds: Set<string>;
  onAdded: (tripId: string) => void;
  variant?: "icon" | "button";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function AddToTripPicker({
  place,
  trips,
  addedTripIds,
  onAdded,
  variant = "icon",
  buttonSize = "sm",
  className,
}: AddToTripPickerProps) {
  const [open, setOpen] = useState(false);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);

  async function handleAddToTrip(tripId: string) {
    setLoadingTripId(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: place.name,
          googlePlaceId: place.googlePlaceId,
          latitude: place.latitude,
          longitude: place.longitude,
        }),
      });

      if (res.ok) {
        if (typeof pendo !== "undefined") {
          pendo.track("place_added_to_trip", {
            tripId,
            googlePlaceId: place.googlePlaceId,
            placeName: place.name,
            source: "explore",
          });
        }
        onAdded(tripId);
        setOpen(false);
      }
    } finally {
      setLoadingTripId(null);
    }
  }

  const trigger =
    variant === "button" ? (
      <Button
        variant="outline"
        size={buttonSize}
        className={cn("w-full cursor-pointer", className)}
      >
        <Plus className="h-4 w-4" />
        Add to trip
      </Button>
    ) : (
      <button
        type="button"
        className={cn(
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-sm transition-colors hover:bg-white",
          className,
        )}
        aria-label="Add to trip"
      >
        <Plus className="h-4 w-4" />
      </button>
    );

  const picker = (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="text-sm text-neutral-600">
          Create a trip first to save places.
        </p>
        <Button asChild size="sm" className="mt-3 w-full cursor-pointer">
          <Link href="/trips/new">Create trip</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );

  if (trips.length === 0) {
    return variant === "button" ? (
      <div className="min-w-0 flex-1 basis-0">{picker}</div>
    ) : (
      picker
    );
  }

  const tripPicker = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="mb-2 px-2 text-xs font-medium text-neutral-500">
          Add to trip
        </p>
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {trips.map((trip) => {
            const added = addedTripIds.has(trip.id);
            const loading = loadingTripId === trip.id;

            return (
              <button
                key={trip.id}
                type="button"
                disabled={added || loading}
                onClick={() => handleAddToTrip(trip.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">
                    {trip.title}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {trip.destination}
                  </p>
                </div>
                {loading ? (
                  <Spinner size="sm" />
                ) : added ? (
                  <span className="text-xs text-neutral-400">Added</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );

  return variant === "button" ? (
    <div className="min-w-0 flex-1 basis-0">{tripPicker}</div>
  ) : (
    tripPicker
  );
}
