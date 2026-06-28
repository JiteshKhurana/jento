"use client";

import { useCallback, useEffect, useState, type ComponentProps, type ComponentType } from "react";
import { Plus, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PlaceSearchCard } from "@/components/ideas/place-search-card";
import { ItemDetailDialog } from "@/components/itinerary/item-detail-dialog";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { cn } from "@/lib/utils";
import { placeToDetailItem } from "@/lib/itinerary/detail-item";
import type { PlaceSearchResult } from "@/lib/places/google-places";
import type { BudgetTier } from "@/lib/trips/intake";

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
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("search");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]["id"]>("for-you");
  const [searchQuery, setSearchQuery] = useState("");
  const [budget, setBudget] = useState<BudgetTier | null>(null);
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [addingFromDetail, setAddingFromDetail] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === category)!;

  const runSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const q = query.trim() || activeCategory.query;
        const params = new URLSearchParams({ q, location: destination });
        if (budget) params.set("budget", budget);
        const res = await fetch(`/api/places/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          if (typeof pendo !== "undefined") {
            pendo.track("idea_search_executed", {
              tripId,
              searchQuery: q,
              destination,
              category: activeCategory.label,
              budget: budget ?? "none",
              resultsCount: data.length,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [destination, activeCategory, budget, tripId],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setAddedIds(new Set());
        setSelectedPlace(null);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleBudgetChange = useCallback((nextBudget: BudgetTier | null) => {
    setAddedIds(new Set());
    setSelectedPlace(null);
    setBudget(nextBudget);
  }, []);

  useEffect(() => {
    if (!open || tab !== "search") return;

    const delay = searchQuery.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      void runSearch(searchQuery);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchQuery, open, tab, category, budget, runSearch]);

  async function addPlaceAsIdea(place: PlaceSearchResult) {
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
        pendo.track("idea_added", {
          tripId,
          ideaSource: "place_search",
          hasGooglePlaceId: true,
          destination,
          ideaTitle: place.name,
        });
      }
      setAddedIds((prev) => new Set(prev).add(place.googlePlaceId));
      onIdeaAdded();
    }
    return res.ok;
  }

  async function handleAddPlace(place: PlaceSearchResult) {
    await addPlaceAsIdea(place);
  }

  async function handleAddFromDetail() {
    if (!selectedPlace) return;
    setAddingFromDetail(true);
    try {
      await addPlaceAsIdea(selectedPlace);
    } finally {
      setAddingFromDetail(false);
    }
  }

  const selectedPlaceAdded = selectedPlace
    ? addedIds.has(selectedPlace.googlePlaceId)
    : false;

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
        if (typeof pendo !== "undefined") {
          pendo.track("custom_idea_added", {
            tripId,
            ideaTitle: customTitle.trim(),
            hasNotes: !!customNotes.trim(),
            destination,
          });
        }
        setCustomTitle("");
        setCustomNotes("");
        onIdeaAdded();
        onOpenChange(false);
      }
    } finally {
      setSavingCustom(false);
    }
  }

  const addIdeasContent = (
    Title: ComponentType<ComponentProps<typeof DialogTitle>>,
  ) => (
    <>
      <div className="sticky top-0 z-10 shrink-0 border-b border-neutral-100 bg-white px-4 pt-4">
            <div className="flex items-center justify-between gap-3 pb-4">
              <Title className="text-base font-semibold md:text-lg">
                Add to trip
              </Title>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-6 border-b border-neutral-100">
              {(["search", "custom"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "cursor-pointer pb-3 text-sm font-medium capitalize transition-colors",
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
              <div className="shrink-0 space-y-3 border-b border-neutral-100 px-4 py-4">
                <p className="text-lg font-bold text-neutral-900">
                  {destination}
                </p>

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-9"
                    />
                  </div>
                  <ExploreFilters
                    budget={budget}
                    onBudgetChange={handleBudgetChange}
                  />
                </div>

                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setAddedIds(new Set());
                        setSelectedPlace(null);
                        setCategory(cat.id);
                      }}
                      className={cn(
                        "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
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

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6">
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="aspect-4/3 w-full rounded-2xl" />
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
                        onSelect={setSelectedPlace}
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
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
                <p className="mb-6 text-sm text-neutral-500">
                  Add a custom idea — a restaurant someone recommended, a hike
                  you heard about, or anything else worth remembering.
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
                  className="mt-6 hidden w-full cursor-pointer md:inline-flex"
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
              </div>

              <div className="sticky bottom-0 z-10 shrink-0 border-t border-neutral-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
                <Button
                  type="submit"
                  disabled={!customTitle.trim() || savingCustom}
                  className="h-11 w-full cursor-pointer"
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
              </div>
            </form>
          )}
    </>
  );

  return (
    <>
      <ItemDetailDialog
        item={selectedPlace ? placeToDetailItem(selectedPlace) : null}
        destination={destination}
        open={selectedPlace != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPlace(null);
        }}
        headerActions={
          selectedPlace ? (
            <Button
              size="sm"
              disabled={addingFromDetail || selectedPlaceAdded}
              onClick={handleAddFromDetail}
              className="h-auto flex-1 cursor-pointer gap-1.5 rounded-xl py-2.5 text-sm md:h-8 md:flex-none md:rounded-full md:py-0 md:text-xs"
            >
              {addingFromDetail ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {selectedPlaceAdded
                ? "Added"
                : addingFromDetail
                  ? "Adding…"
                  : "Add idea"}
            </Button>
          ) : null
        }
      />

      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent
            aria-describedby={undefined}
            className="flex h-[88dvh] max-h-[88dvh] flex-col overflow-hidden border-0 bg-white p-0"
          >
            {addIdeasContent(DrawerTitle)}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            showClose={false}
            aria-describedby={undefined}
            className={cn(
              "flex flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl",
              "md:h-[min(90vh,800px)] md:max-h-[min(90vh,800px)] md:max-w-2xl",
            )}
          >
            {addIdeasContent(DialogTitle)}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
