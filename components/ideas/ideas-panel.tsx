"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeaCard, type TripIdeaData } from "@/components/ideas/idea-card";
import { AddIdeasDialog } from "@/components/ideas/add-ideas-dialog";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";

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

  const fetchIdeas = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/ideas`);
    if (res.ok) {
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  async function handleDelete(ideaId: string) {
    const res = await fetch(`/api/trips/${tripId}/ideas/${ideaId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    }
  }

  async function handleAddToItinerary(ideaId: string, dayId: string) {
    const res = await fetch(
      `/api/trips/${tripId}/ideas/${ideaId}/add-to-itinerary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId }),
      },
    );
    if (res.ok) {
      onItineraryUpdate?.();
    }
  }

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
        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-8 rounded-full bg-blue-100/60 blur-2xl" />
            <div className="relative flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Lightbulb className="h-8 w-8 fill-amber-400 text-amber-500" />
              </div>
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-16 overflow-hidden rounded-xl border-2 border-white bg-neutral-100 shadow-sm"
                    style={{ transform: `rotate(${(i - 1) * 6}deg)` }}
                  >
                    <div className="h-10 bg-linear-to-br from-sky-100 to-blue-200" />
                    <div className="space-y-1 p-1.5">
                      <div className="h-1 rounded bg-neutral-200" />
                      <div className="h-1 w-2/3 rounded bg-neutral-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-neutral-900">
            Add places you might want to go.
          </h2>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">
            Got ideas? Add them here. Consider it your &ldquo;maybe&rdquo; list.
          </p>

          {!readOnly && (
            <Button onClick={() => setAddOpen(true)} className="mt-8 gap-1.5">
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
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-lg font-bold text-neutral-900">Ideas</h2>
          {!readOnly && (
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
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
