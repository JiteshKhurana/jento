"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { ThemeIllustration } from "@/components/ui/theme-illustration";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IdeaCard, type TripIdeaData } from "@/components/ideas/idea-card";
import { AddIdeasDialog } from "@/components/ideas/add-ideas-dialog";
import { ItemDetailDialog } from "@/components/itinerary/item-detail-dialog";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { ideaToDetailItem } from "@/lib/itinerary/detail-item";
import { getAddedIdeaIds } from "@/lib/itinerary/idea-status";

type IdeasPanelProps = {
  tripId: string;
  destination: string;
  days: ItineraryDayData[];
  onItineraryUpdate?: () => void;
  readOnly?: boolean;
};

export function IdeasPanel({
  tripId,
  destination,
  days,
  onItineraryUpdate,
  readOnly = false,
}: IdeasPanelProps) {
  const [ideas, setIdeas] = useState<TripIdeaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [detailIdeaId, setDetailIdeaId] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [optimisticallyAddedIds, setOptimisticallyAddedIds] = useState<
    Set<string>
  >(new Set());

  const addedIdeaIds = useMemo(() => {
    const fromItinerary = getAddedIdeaIds(ideas, days);
    return new Set([...fromItinerary, ...optimisticallyAddedIds]);
  }, [ideas, days, optimisticallyAddedIds]);

  const detailIdea =
    detailIdeaId != null
      ? (ideas.find((i) => i.id === detailIdeaId) ?? null)
      : null;

  const fetchIdeas = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/ideas`);
    if (res.ok) {
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    }
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trips/${tripId}/ideas`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setIdeas(data?.ideas ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  async function handleDelete(ideaId: string) {
    const res = await fetch(`/api/trips/${tripId}/ideas/${ideaId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (typeof pendo !== "undefined") {
        pendo.track("idea_deleted", {
          tripId,
          ideaId,
        });
      }
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    }
  }

  async function addIdeaToItinerary(ideaId: string, dayId: string) {
    const res = await fetch(
      `/api/trips/${tripId}/ideas/${ideaId}/add-to-itinerary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId }),
      },
    );
    if (res.ok) {
      if (typeof pendo !== "undefined") {
        const day = days.find((d) => d.id === dayId);
        pendo.track("idea_added_to_itinerary", {
          tripId,
          ideaId,
          dayId,
          dayNumber: day?.dayNumber ?? 0,
        });
      }
      setOptimisticallyAddedIds((prev) => new Set(prev).add(ideaId));
      onItineraryUpdate?.();
    }
    return res.ok;
  }

  async function handleAddToItinerary(ideaId: string, dayId: string) {
    await addIdeaToItinerary(ideaId, dayId);
  }

  async function handleAddToDayFromDetail(dayId: string) {
    if (!detailIdeaId) return;
    setDayPickerOpen(false);
    setAddingToDay(true);
    try {
      await addIdeaToItinerary(detailIdeaId, dayId);
    } finally {
      setAddingToDay(false);
    }
  }

  async function handleDeleteFromDetail() {
    if (!detailIdeaId) return;
    setDeleting(true);
    try {
      await handleDelete(detailIdeaId);
      setDetailIdeaId(null);
    } finally {
      setDeleting(false);
    }
  }

  const detailIdeaAdded = detailIdea != null && addedIdeaIds.has(detailIdea.id);

  const detailHeaderActions =
    !readOnly && detailIdea ? (
      <>
        {days.length > 0 ? (
          detailIdeaAdded ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="h-8 text-xs text-neutral-500"
            >
              Added
            </Button>
          ) : (
            <Popover open={dayPickerOpen} onOpenChange={setDayPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={addingToDay}
                  className="h-8 gap-1.5 text-xs"
                >
                  {addingToDay ? (
                    <Spinner size="sm" />
                  ) : (
                    <CalendarPlus className="h-3.5 w-3.5" />
                  )}
                  {addingToDay ? "Adding…" : "Add to trip"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-2">
                <p className="mb-2 px-2 text-xs font-medium text-neutral-500">
                  Choose a day
                </p>
                <div className="space-y-0.5">
                  {days.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToDayFromDetail(day.id);
                      }}
                      disabled={addingToDay}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100"
                    >
                      Day {day.dayNumber}: {day.title}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        ) : null}
        <Button
          size="sm"
          variant="outline"
          disabled={deleting}
          onClick={handleDeleteFromDetail}
          className="h-8 w-8 p-0 text-neutral-400 hover:border-red-200 hover:text-red-600"
          aria-label={deleting ? "Removing idea…" : "Remove idea"}
        >
          {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </>
    ) : null;

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <>
        <ItemDetailDialog
          item={detailIdea ? ideaToDetailItem(detailIdea) : null}
          destination={destination}
          open={detailIdeaId != null}
          onOpenChange={(open) => {
            if (!open) setDetailIdeaId(null);
          }}
          headerActions={detailHeaderActions}
        />

        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
          <ThemeIllustration variant="ideas" className="mb-6" />

          <h2 className="text-lg font-bold text-neutral-900">
            Add places you might want to go.
          </h2>

          {!readOnly && (
            <Button
              onClick={() => setAddOpen(true)}
              className="mt-8 gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add ideas
            </Button>
          )}
        </div>

        {!readOnly && (
          <AddIdeasDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            tripId={tripId}
            destination={destination}
            onIdeaAdded={fetchIdeas}
          />
        )}
      </>
    );
  }

  return (
    <>
      <ItemDetailDialog
        item={detailIdea ? ideaToDetailItem(detailIdea) : null}
        destination={destination}
        open={detailIdeaId != null}
        onOpenChange={(open) => {
          if (!open) setDetailIdeaId(null);
        }}
        headerActions={detailHeaderActions}
      />

      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-lg font-bold text-neutral-900">Ideas</h2>
          {!readOnly && (
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add ideas
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                days={days}
                onDelete={handleDelete}
                onAddToItinerary={handleAddToItinerary}
                onSelect={setDetailIdeaId}
                added={addedIdeaIds.has(idea.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <AddIdeasDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          tripId={tripId}
          destination={destination}
          onIdeaAdded={fetchIdeas}
        />
      )}
    </>
  );
}
