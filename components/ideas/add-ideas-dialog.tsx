"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PlaceSearchCard } from "@/components/ideas/place-search-card";
import { cn } from "@/lib/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type AddIdeasDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  destination: string;
  onIdeaAdded: () => void;
};

type Tab = "search" | "custom";

const CATEGORIES = [
  { id: "for-you", label: "For you", query: "top attractions" },
  { id: "things", label: "Things to do", query: "things to do attractions" },
  { id: "restaurants", label: "Restaurants", query: "restaurants" },
  { id: "stays", label: "Stays", query: "hotels" },
  { id: "locations", label: "Locations", query: "neighborhoods landmarks" },
] as const;

export function AddIdeasDialog({
  open,
  onOpenChange,
  tripId,
  destination,
  onIdeaAdded,
}: AddIdeasDialogProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("for-you");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === category)!;

  const runSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const q = query.trim() || activeCategory.query;
        const params = new URLSearchParams({ q, location: destination });
        const res = await fetch(`/api/places/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    },
    [destination, activeCategory.query],
  );

  useEffect(() => {
    if (!open) return;
    setAddedIds(new Set());
    runSearch("");
  }, [open, category, runSearch]);

  useEffect(() => {
    if (!open || tab !== "search") return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        runSearch(searchQuery);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, open, tab, runSearch]);

  async function handleAddPlace(place: PlaceSearchResult) {
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
      setAddedIds((prev) => new Set(prev).add(place.googlePlaceId));
      onIdeaAdded();
    }
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;

    setSavingCustom(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle.trim(),
          notes: customNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setCustomTitle("");
        setCustomNotes("");
        onIdeaAdded();
        onOpenChange(false);
      }
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="flex h-[min(90vh,800px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <DialogTitle className="text-base font-semibold">Add to trip</DialogTitle>
            <div className="w-8" />
          </div>

          <div className="mt-4 flex gap-6 border-b border-neutral-100">
            {(["search", "custom"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "pb-3 text-sm font-medium capitalize transition-colors",
                  tab === t
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-600",
                )}
              >
                {t === "search" ? "Search" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {tab === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 space-y-3 px-4 py-4">
              <p className="text-lg font-bold text-neutral-900">{destination}</p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-9"
                  />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      category === cat.id
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                {activeCategory.label === "For you" ? "Things To Do" : activeCategory.label}
              </h3>

              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">
                  No places found. Try a different search.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {results.map((place) => (
                    <PlaceSearchCard
                      key={place.googlePlaceId}
                      place={place}
                      destination={destination}
                      onAdd={handleAddPlace}
                      added={addedIds.has(place.googlePlaceId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleAddCustom}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6"
          >
            <p className="mb-6 text-sm text-neutral-500">
              Add a custom idea — a restaurant someone recommended, a hike you heard about, or
              anything else worth remembering.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-title">Title</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Sunset kayak tour"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-notes">Notes (optional)</Label>
                <Textarea
                  id="custom-notes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Any details to remember…"
                  rows={3}
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!customTitle.trim() || savingCustom}
              className="mt-6 w-full"
            >
              {savingCustom ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Adding…
                </>
              ) : (
                "Add idea"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
