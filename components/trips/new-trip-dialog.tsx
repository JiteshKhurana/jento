"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { CalendarDays, Info, Mic, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  AddLocationButton,
  DestinationAutocomplete,
  LocationChip,
  type SelectedLocation,
} from "@/components/trips/destination-autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  BUDGET_LABELS,
  TRAVELER_LABELS,
  formatTravelerSummary,
  type BudgetTier,
  type TravelerType,
} from "@/lib/trips/intake";
import { getCurrentLocation } from "@/lib/locations/get-current-location";

type TimingMode = "flexible" | "dates";

type HeroImage = {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
};

const FALLBACK_HERO_IMAGE: HeroImage = {
  url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  alt: "Travel destination",
  photographer: "Unsplash",
  photographerUrl:
    "https://unsplash.com?utm_source=tripzy&utm_medium=referral",
};

type NewTripDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDestination(locations: SelectedLocation[], isRoadTrip: boolean) {
  const separator = isRoadTrip ? " → " : ", ";
  return locations
    .map((l) => l.label.split(",").slice(0, 2).join(",").trim() || l.name)
    .join(separator);
}

export function NewTripDialog({ open, onOpenChange }: NewTripDialogProps) {
  const router = useRouter();
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.username ?? "there";

  const [locations, setLocations] = useState<SelectedLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [isRoadTrip, setIsRoadTrip] = useState(false);
  const [timingMode, setTimingMode] = useState<TimingMode>("dates");
  const [flexibleDays, setFlexibleDays] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [preferences, setPreferences] = useState("");
  const [travelerType, setTravelerType] = useState<TravelerType | null>(null);
  const [travelerCount, setTravelerCount] = useState("");
  const [budget, setBudget] = useState<BudgetTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [heroImage, setHeroImage] = useState<HeroImage>(FALLBACK_HERO_IMAGE);
  const [heroImageLoading, setHeroImageLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const query = locations[0]?.name ?? "";
    const controller = new AbortController();

    // Defer state updates to avoid synchronous setState inside effect
    Promise.resolve().then(() => setHeroImageLoading(true));
    fetch(`/api/unsplash/photo?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HeroImage | null) => {
        if (data?.url) setHeroImage(data);
      })
      .catch(() => {})
      .finally(() => setHeroImageLoading(false));

    return () => controller.abort();
  }, [open, locations]);

  useEffect(() => {
    if (open) return;

    // Defer state resets so they're scheduled after the current render
    Promise.resolve().then(() => {
      setLocations([]);
      setSearchQuery("");
      setShowSearch(true);
      setIsRoadTrip(false);
      setTimingMode("dates");
      setFlexibleDays("");
      setDateRange(undefined);
      setPreferences("");
      setTravelerType(null);
      setTravelerCount("");
      setBudget(null);
      setLoading(false);
      setHeroImage(FALLBACK_HERO_IMAGE);
      setHeroImageLoading(false);
    });
  }, [open]);

  function addLocation(location: SelectedLocation) {
    setLocations((prev) => {
      if (prev.some((l) => l.id === location.id)) return prev;
      return [...prev, location];
    });
    setSearchQuery("");
    setShowSearch(false);
  }

  function removeLocation(id: string) {
    setLocations((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (next.length === 0) setShowSearch(true);
      return next;
    });
  }

  async function handleCreate() {
    if (locations.length === 0 || loading) return;

    const destination = formatDestination(locations, isRoadTrip);
    const title = `${locations[0].name}${locations.length > 1 ? ` +${locations.length - 1}` : ""} trip`;

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (timingMode === "dates" && dateRange?.from) {
      startDate = dateRange.from.toISOString();
      endDate = (dateRange.to ?? dateRange.from).toISOString();
    }

    const initialParts: string[] = [`Plan a trip to ${destination}.`];
    if (isRoadTrip) initialParts.push("This is a road trip.");

    setLoading(true);
    try {
      const startingLocation = await getCurrentLocation();
      if (startingLocation) {
        initialParts.push(
          isRoadTrip
            ? `Starting from ${startingLocation.label || startingLocation.name}.`
            : `Departing from near ${startingLocation.label || startingLocation.name}.`,
        );
      }

      const tripPreferences = {
        locations,
        isRoadTrip,
        startingLocation,
        timingMode,
        flexibleDays:
          timingMode === "flexible" ? Number(flexibleDays) || null : null,
        travelers: travelerType
          ? {
              type: travelerType,
              count: travelerCount ? Number(travelerCount) : null,
            }
          : null,
        budget,
        notes: preferences.trim() || null,
      };

      if (timingMode === "flexible" && flexibleDays) {
        initialParts.push(`Flexible timing, about ${flexibleDays} days.`);
      } else if (startDate) {
        initialParts.push(
          `Dates: ${format(new Date(startDate), "MMM d, yyyy")}${endDate && endDate !== startDate ? ` – ${format(new Date(endDate), "MMM d, yyyy")}` : ""}.`,
        );
      }
      if (travelerType) {
        initialParts.push(
          `Traveling as ${formatTravelerSummary(travelerType, travelerCount ? Number(travelerCount) : undefined).toLowerCase()}.`,
        );
      }
      if (budget) {
        initialParts.push(`${BUDGET_LABELS[budget]} budget.`);
      }
      if (preferences.trim()) initialParts.push(preferences.trim());

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          destination,
          startDate,
          endDate,
          preferences: tripPreferences,
        }),
      });

      if (!res.ok) throw new Error("Failed to create trip");

      const trip = await res.json();
      const q = encodeURIComponent(initialParts.join(" "));
      onOpenChange(false);
      router.push(`/trips/${trip.id}?q=${q}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const canCreate =
    locations.length > 0 &&
    travelerType !== null &&
    budget !== null &&
    !loading &&
    (travelerType === "friends" || travelerType === "group"
      ? travelerCount.trim() !== ""
      : true) &&
    (timingMode === "flexible"
      ? flexibleDays.trim() !== ""
      : !!dateRange?.from);

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Pick dates";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-hidden border-0 p-0 sm:rounded-3xl"
      >
        <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:overflow-hidden">
          <div className="relative hidden min-h-[320px] md:block md:min-h-0">
            {heroImageLoading && (
              <Skeleton className="absolute inset-0 rounded-none" />
            )}
            <Image
              key={heroImage.url}
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                heroImageLoading ? "opacity-0" : "opacity-100",
              )}
              priority
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition-colors hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <a
              href={heroImage.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-sm transition-colors hover:bg-white"
              title={`Photo by ${heroImage.photographer} on Unsplash`}
              aria-label={`Photo by ${heroImage.photographer} on Unsplash`}
            >
              <Info className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col bg-white p-6 md:overflow-y-auto md:p-8">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mb-4 ml-auto flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 md:hidden"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Where to, {firstName}?
            </DialogTitle>

            <div className="mt-8 space-y-6">
              <div className="space-y-3">
                <Label>Destination</Label>

                <div className="space-y-2">
                  {locations.map((location) => (
                    <LocationChip
                      key={location.id}
                      location={location}
                      onRemove={() => removeLocation(location.id)}
                    />
                  ))}

                  {(showSearch || locations.length === 0) && (
                    <DestinationAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSelect={addLocation}
                      autoFocus={open && locations.length === 0}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {locations.length > 0 && !showSearch && (
                    <AddLocationButton onClick={() => setShowSearch(true)} />
                  )}
                  {locations.length === 0 && <div />}

                  <div className="flex items-center gap-2.5">
                    <Label
                      htmlFor="road-trip"
                      className="font-normal text-neutral-600"
                    >
                      Road trip?
                    </Label>
                    <Switch
                      id="road-trip"
                      checked={isRoadTrip}
                      onCheckedChange={setIsRoadTrip}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Timing</Label>
                <div className="flex gap-2">
                  {(["flexible", "dates"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTimingMode(mode)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        timingMode === mode
                          ? "border-neutral-900 bg-white text-neutral-900"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                      )}
                    >
                      {mode === "flexible" ? "Flexible" : "Select dates"}
                    </button>
                  ))}
                </div>

                {timingMode === "flexible" ? (
                  <div className="space-y-2">
                    <Label
                      htmlFor="flexible-days"
                      className="font-normal text-neutral-600"
                    >
                      How many days?
                    </Label>
                    <Input
                      id="flexible-days"
                      type="number"
                      min={1}
                      max={365}
                      placeholder="e.g. 7"
                      value={flexibleDays}
                      onChange={(e) => setFlexibleDays(e.target.value)}
                      className="max-w-[140px]"
                    />
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start rounded-xl text-left font-normal",
                          !dateRange?.from && "text-neutral-400",
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dateLabel}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="space-y-3">
                <Label>Who&apos;s going?</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["solo", "couple", "friends", "family", "group"] as const
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTravelerType(type)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        travelerType === type
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                      )}
                    >
                      {TRAVELER_LABELS[type]}
                    </button>
                  ))}
                </div>
                {(travelerType === "friends" || travelerType === "group") && (
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    placeholder="How many people?"
                    value={travelerCount}
                    onChange={(e) => setTravelerCount(e.target.value)}
                    className="max-w-[160px]"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label>Budget</Label>
                <div className="flex flex-wrap gap-2">
                  {(["budget", "moderate", "upscale", "luxury"] as const).map(
                    (tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setBudget(tier)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          budget === tier
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                        )}
                      >
                        {BUDGET_LABELS[tier]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="trip-preferences">Anything else?</Label>
                <div className="relative">
                  <Textarea
                    id="trip-preferences"
                    placeholder="Must-dos, pace, dietary needs, vibe…"
                    value={preferences}
                    onChange={(e) =>
                      setPreferences(e.target.value.slice(0, 2000))
                    }
                    rows={4}
                    className="resize-none pb-10"
                  />
                  <Mic className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-neutral-300" />
                </div>
                <p className="text-right text-xs text-neutral-400">
                  {preferences.length}/2000 characters
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="mt-8 mb-2 h-14 w-full px-10 py-2 text-base"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
