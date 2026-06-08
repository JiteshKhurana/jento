"use client";

import { useState } from "react";
import { CalendarPlus, MapPin, Star, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getPlacePhotoUrl } from "@/lib/places/utils";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";

export type TripIdeaData = {
  id: string;
  title: string;
  notes?: string | null;
  type: string;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeCache?: {
    googlePlaceId: string;
    name: string;
    address?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    photos?: unknown;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

type IdeaCardProps = {
  idea: TripIdeaData;
  days: ItineraryDayData[];
  onDelete: (ideaId: string) => Promise<void>;
  onAddToItinerary: (ideaId: string, dayId: string) => Promise<void>;
  readOnly?: boolean;
};

function resolveImageUrl(idea: TripIdeaData): string | null {
  return getPlacePhotoUrl(idea.googlePlaceId);
}

export function IdeaCard({
  idea,
  days,
  onDelete,
  onAddToItinerary,
  readOnly = false,
}: IdeaCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const imageUrl = resolveImageUrl(idea);
  const rating = idea.placeCache?.rating;

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(idea.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddToDay(dayId: string) {
    setAdding(true);
    try {
      await onAddToItinerary(idea.id, dayId);
      setDayPickerOpen(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      {imageUrl ? (
        <div className="relative h-36 w-full bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={idea.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200/60">
          <MapPin className="h-8 w-8 text-neutral-300" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-neutral-900">{idea.title}</h4>
            {idea.placeCache?.address && (
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {idea.placeCache.address}
              </p>
            )}
          </div>
          {rating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {idea.notes && (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-600">{idea.notes}</p>
        )}

        {!readOnly && (
        <div className="mt-3 flex items-center gap-2">
          {days.length > 0 ? (
            <Popover open={dayPickerOpen} onOpenChange={setDayPickerOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" disabled={adding} className="h-8 text-xs">
                  {adding ? (
                    <Spinner size="sm" />
                  ) : (
                    <CalendarPlus className="h-3.5 w-3.5" />
                  )}
                  {adding ? "Adding…" : "Add to trip"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2">
                <p className="mb-2 px-2 text-xs font-medium text-neutral-500">
                  Choose a day
                </p>
                <div className="space-y-0.5">
                  {days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleAddToDay(day.id)}
                      disabled={adding}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100"
                    >
                      Day {day.dayNumber}: {day.title}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-xs text-neutral-400">
              Generate an itinerary to add this
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            onClick={handleDelete}
            className="ml-auto h-8 w-8 p-0 text-neutral-400 hover:text-red-600"
            aria-label={deleting ? "Removing idea…" : "Remove idea"}
          >
            {deleting ? (
              <Spinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        )}
      </div>
    </article>
  );
}
