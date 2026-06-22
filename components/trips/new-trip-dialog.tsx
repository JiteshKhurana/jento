"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import { CalendarDays, Lightbulb, X } from "lucide-react";
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
import { MAX_TRIP_DAYS, toCalendarDateISO } from "@/lib/trips/dates";
import {
  MAX_TRIPS_PER_USER,
  getCreateTripErrorMessage,
  getTripLimitMessage,
} from "@/lib/trips/limits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BUDGET_CURRENCIES,
  DEFAULT_BUDGET_CURRENCY,
  DEFAULT_END_DAY_BY,
  DIETARY_DESCRIPTIONS,
  DIETARY_LABELS,
  PACE_DESCRIPTIONS,
  PACE_LABELS,
  TRAVELER_LABELS,
  formatEndDayBySummary,
  formatTravelerSummary,
  travelerTypeRequiresCount,
  type DietaryPreference,
  type TravelerType,
  type TripPace,
} from "@/lib/trips/intake";
import { getCurrentLocation } from "@/lib/locations/get-current-location";
import {
  formatRecommendedDaysLabel,
  type RecommendedDaysResult,
} from "@/lib/trips/recommended-days";

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
  photographerUrl: "https://unsplash.com?utm_source=jento&utm_medium=referral",
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
  const [departFromCurrent, setDepartFromCurrent] = useState(true);
  const [departureLocation, setDepartureLocation] =
    useState<SelectedLocation | null>(null);
  const [departureSearchQuery, setDepartureSearchQuery] = useState("");
  const [isRoadTrip, setIsRoadTrip] = useState(false);
  const [timingMode, setTimingMode] = useState<TimingMode | null>(null);
  const [flexibleDays, setFlexibleDays] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [travelerType, setTravelerType] = useState<TravelerType | null>(null);
  const [travelerCount, setTravelerCount] = useState("");
  const [travelingWithPets, setTravelingWithPets] = useState(false);
  const [travelingWithInfants, setTravelingWithInfants] = useState(false);
  const [pace, setPace] = useState<TripPace | null>(null);
  const [dietary, setDietary] = useState<DietaryPreference | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState(DEFAULT_BUDGET_CURRENCY);
  const [endDayByTime, setEndDayByTime] = useState(DEFAULT_END_DAY_BY);
  const [loading, setLoading] = useState(false);
  const [tripLimitReached, setTripLimitReached] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<HeroImage>(FALLBACK_HERO_IMAGE);
  const [heroImageLoading, setHeroImageLoading] = useState(false);
  const [recommendedDays, setRecommendedDays] =
    useState<RecommendedDaysResult | null>(null);
  const [recommendedDaysLoading, setRecommendedDaysLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    fetch("/api/trips", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((trips: unknown[]) => {
        setTripLimitReached(trips.length >= MAX_TRIPS_PER_USER);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const latestLocation = locations.at(-1);
    const query = latestLocation?.name ?? "";
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
    if (!open || locations.length === 0) return;

    const controller = new AbortController();
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setRecommendedDays(null);
      setRecommendedDaysLoading(true);
    });

    fetch("/api/trips/recommended-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        destinations: locations.map((location) => ({
          name: location.name,
          label: location.label,
          countryCode: location.countryCode,
        })),
        isRoadTrip,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecommendedDaysResult | null) => {
        if (!active) return;
        if (data?.days) setRecommendedDays(data);
        else setRecommendedDays(null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setRecommendedDaysLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, locations, isRoadTrip]);

  useEffect(() => {
    if (open) return;

    // Defer state resets so they're scheduled after the current render
    Promise.resolve().then(() => {
      setLocations([]);
      setSearchQuery("");
      setShowSearch(true);
      setDepartFromCurrent(true);
      setDepartureLocation(null);
      setDepartureSearchQuery("");
      setIsRoadTrip(false);
      setTimingMode(null);
      setFlexibleDays("");
      setDateRange(undefined);
      setDatePickerOpen(false);
      setPreferences("");
      setTravelerType(null);
      setTravelerCount("");
      setTravelingWithPets(false);
      setTravelingWithInfants(false);
      setPace(null);
      setDietary(null);
      setBudgetAmount("");
      setBudgetCurrency(DEFAULT_BUDGET_CURRENCY);
      setEndDayByTime(DEFAULT_END_DAY_BY);
      setLoading(false);
      setTripLimitReached(false);
      setCreateError(null);
      setHeroImage(FALLBACK_HERO_IMAGE);
      setHeroImageLoading(false);
      setRecommendedDays(null);
      setRecommendedDaysLoading(false);
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

  function handleDateRangeSelect(range: DateRange | undefined) {
    if (range?.from && range?.to) {
      const days =
        differenceInCalendarDays(startOfDay(range.to), startOfDay(range.from)) +
        1;
      if (days > MAX_TRIP_DAYS) {
        setDateRange({
          from: range.from,
          to: addDays(range.from, MAX_TRIP_DAYS - 1),
        });
        return;
      }
    }
    setDateRange(range);
  }

  function isDateDisabled(date: Date) {
    const day = startOfDay(date);
    const today = startOfDay(new Date());
    if (day < today) return true;
    if (dateRange?.from) {
      const maxEnd = addDays(startOfDay(dateRange.from), MAX_TRIP_DAYS - 1);
      if (day > maxEnd) return true;
    }
    return false;
  }

  async function handleCreate() {
    if (locations.length === 0 || loading || tripLimitReached) return;

    const destination = formatDestination(locations, isRoadTrip);
    const title = `${locations[0].name}${locations.length > 1 ? ` +${locations.length - 1}` : ""} trip`;

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (timingMode === "dates" && dateRange?.from) {
      startDate = toCalendarDateISO(dateRange.from);
      endDate = toCalendarDateISO(dateRange.to ?? dateRange.from);
    }

    const initialParts: string[] = [`Plan a trip to ${destination}.`];
    if (isRoadTrip) initialParts.push("This is a road trip.");

    setLoading(true);
    setCreateError(null);
    try {
      let startingLocation = null;
      if (departFromCurrent) {
        startingLocation = await getCurrentLocation();
      } else if (departureLocation) {
        startingLocation = {
          name: departureLocation.name,
          label: departureLocation.label,
          latitude: departureLocation.latitude,
          longitude: departureLocation.longitude,
        };
      }

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
        pace,
        dietary,
        budgetPerPerson: budgetAmount ? Number(budgetAmount) : null,
        budgetCurrency,
        endDayBy: endDayByTime || null,
        travelingWithPets,
        travelingWithInfants,
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
      if (travelingWithPets) {
        initialParts.push(
          "Traveling with pets — prefer pet-friendly stays and activities.",
        );
      }
      if (travelingWithInfants) {
        initialParts.push(
          "Traveling with infants — plan for stroller-friendly routes, nap breaks, and family-friendly venues.",
        );
      }
      if (budgetAmount && Number(budgetAmount) > 0) {
        const symbol =
          BUDGET_CURRENCIES.find((c) => c.code === budgetCurrency)?.symbol ??
          budgetCurrency;
        initialParts.push(
          `Budget of ${symbol}${Number(budgetAmount).toLocaleString()} per person.`,
        );
      }
      if (pace) {
        initialParts.push(
          `Prefer a ${PACE_LABELS[pace].toLowerCase()} pace (${PACE_DESCRIPTIONS[pace].toLowerCase()}).`,
        );
      }
      if (endDayByTime) {
        initialParts.push(
          `End each day by ${formatEndDayBySummary(endDayByTime)}.`,
        );
      }
      if (dietary) {
        initialParts.push(
          `Dietary preference: ${DIETARY_LABELS[dietary].toLowerCase()} (${DIETARY_DESCRIPTIONS[dietary].toLowerCase()}).`,
        );
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

      if (!res.ok) {
        const message = await getCreateTripErrorMessage(res);
        if (res.status === 429) setTripLimitReached(true);
        throw new Error(message);
      }

      const trip = await res.json();
      const q = encodeURIComponent(initialParts.join(" "));

      if (typeof pendo !== "undefined") {
        pendo.track("trip_created", {
          tripId: trip.id,
          destination,
          isRoadTrip,
          timingMode: timingMode ?? "none",
          flexibleDays:
            timingMode === "flexible" ? Number(flexibleDays) || 0 : 0,
          hasStartDate: !!startDate,
          hasEndDate: !!endDate,
          travelerType: travelerType ?? "none",
          travelerCount: travelerCount ? Number(travelerCount) : 1,
          travelingWithPets,
          travelingWithInfants,
          pace: pace ?? "none",
          dietary: dietary ?? "none",
          budgetAmount: Number(budgetAmount) || 0,
          budgetCurrency,
          creationSource: "new_trip_dialog",
          hasPreferences: !!preferences.trim(),
          locationCount: locations.length,
        });
      }

      onOpenChange(false);
      router.push(`/trips/${trip.id}?q=${q}`);
    } catch (err) {
      console.error(err);
      setCreateError(
        err instanceof Error ? err.message : "Failed to create trip",
      );
      setLoading(false);
    }
  }

  const canCreate =
    !tripLimitReached &&
    locations.length > 0 &&
    travelerType !== null &&
    pace !== null &&
    dietary !== null &&
    budgetAmount.trim() !== "" &&
    Number(budgetAmount) > 0 &&
    !loading &&
    (travelerTypeRequiresCount(travelerType)
      ? travelerCount.trim() !== ""
      : true) &&
    timingMode !== null &&
    (timingMode === "flexible"
      ? flexibleDays.trim() !== "" &&
        Number(flexibleDays) > 0 &&
        Number(flexibleDays) <= MAX_TRIP_DAYS
      : !!dateRange?.from) &&
    endDayByTime.trim() !== "" &&
    (departFromCurrent || departureLocation !== null);

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "Pick dates";

  const showRecommendedDays =
    open && locations.length > 0 && (recommendedDaysLoading || recommendedDays);
  const displayedRecommendedDays =
    open && locations.length > 0 ? recommendedDays : null;

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
          </div>

          <div className="relative flex flex-col bg-white p-6 md:overflow-y-auto md:p-8">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Where to, {firstName}?
            </DialogTitle>

            <div className="mt-8 space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label
                    htmlFor="depart-current"
                    className="font-normal text-neutral-600"
                  >
                    Departing from current location?
                  </Label>
                  <Switch
                    id="depart-current"
                    checked={departFromCurrent}
                    onCheckedChange={(checked) => {
                      setDepartFromCurrent(checked);
                      if (checked) {
                        setDepartureLocation(null);
                        setDepartureSearchQuery("");
                      }
                    }}
                  />
                </div>

                {!departFromCurrent && (
                  <div className="space-y-2">
                    <Label className="font-normal text-neutral-600">
                      Where are you departing from?
                    </Label>
                    {departureLocation ? (
                      <LocationChip
                        location={departureLocation}
                        onRemove={() => {
                          setDepartureLocation(null);
                          setDepartureSearchQuery("");
                        }}
                      />
                    ) : (
                      <DestinationAutocomplete
                        value={departureSearchQuery}
                        onChange={setDepartureSearchQuery}
                        onSelect={(location) => {
                          setDepartureLocation(location);
                          setDepartureSearchQuery("");
                        }}
                        placeholder="City, airport, or address"
                        autoFocus={
                          open && !departFromCurrent && !departureLocation
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
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
                      autoFocus={
                        open && locations.length === 0 && departFromCurrent
                      }
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

                {showRecommendedDays && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3">
                      {recommendedDaysLoading ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Spinner className="h-4 w-4" />
                          Calculating recommended stay…
                        </div>
                      ) : displayedRecommendedDays ? (
                        <div className="flex items-start gap-2">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              Recommended:{" "}
                              {formatRecommendedDaysLabel(displayedRecommendedDays)}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-600">
                              {displayedRecommendedDays.summary}
                            </p>
                            {displayedRecommendedDays.perDestination &&
                              displayedRecommendedDays.perDestination.length > 1 && (
                                <p className="mt-1 text-xs text-neutral-500">
                                  {displayedRecommendedDays.perDestination
                                    .map(
                                      (stop) =>
                                        `${stop.name}: ${stop.days} ${stop.days === 1 ? "day" : "days"}`,
                                    )
                                    .join(" · ")}
                                </p>
                              )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
              </div>

              <div className="space-y-4">
                <Label>Timing</Label>
                <div className="flex gap-2">
                  {(["dates", "flexible"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setTimingMode(mode);
                        if (mode === "dates") {
                          setDatePickerOpen(true);
                        } else {
                          setDatePickerOpen(false);
                        }
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        timingMode === mode
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
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
                      max={MAX_TRIP_DAYS}
                      placeholder="e.g. 7"
                      value={flexibleDays}
                      onChange={(e) => setFlexibleDays(e.target.value)}
                      className="max-w-[140px]"
                    />
                  </div>
                ) : timingMode === "dates" ? (
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
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
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                        disabled={isDateDisabled}
                      />
                      <p className="border-t px-3 py-2 text-xs text-neutral-500">
                        Trips can be up to {MAX_TRIP_DAYS} days.
                      </p>
                    </PopoverContent>
                  </Popover>
                ) : null}
              </div>

              <div className="space-y-4">
                <Label>Who&apos;s going?</Label>
                <div className="flex gap-2">
                  <Select
                    value={travelerType ?? undefined}
                    onValueChange={(value) => {
                      const type = value as TravelerType;
                      setTravelerType(type);
                      if (!travelerTypeRequiresCount(type)) {
                        setTravelerCount("");
                      }
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-11",
                        travelerTypeRequiresCount(travelerType)
                          ? "w-[140px] shrink-0"
                          : "flex-1",
                      )}
                    >
                      <SelectValue placeholder="Select travelers" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "solo",
                          "couple",
                          "friends",
                          "family",
                          "group",
                        ] as const
                      ).map((type) => (
                        <SelectItem key={type} value={type}>
                          {TRAVELER_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {travelerTypeRequiresCount(travelerType) && (
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      placeholder="How many people?"
                      value={travelerCount}
                      onChange={(e) => setTravelerCount(e.target.value)}
                      className="flex-1"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2.5">
                    <Label
                      htmlFor="traveling-with-pets"
                      className="font-normal text-neutral-600"
                    >
                      Traveling with pets?
                    </Label>
                    <Switch
                      id="traveling-with-pets"
                      checked={travelingWithPets}
                      onCheckedChange={setTravelingWithPets}
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Label
                      htmlFor="traveling-with-infants"
                      className="font-normal text-neutral-600"
                    >
                      Traveling with infants?
                    </Label>
                    <Switch
                      id="traveling-with-infants"
                      checked={travelingWithInfants}
                      onCheckedChange={setTravelingWithInfants}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Budget per person</Label>
                <div className="flex gap-2">
                  <Select
                    value={budgetCurrency}
                    onValueChange={setBudgetCurrency}
                  >
                    <SelectTrigger className="h-11 w-auto shrink-0 px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 1500"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Trip pace</Label>
                <div className="flex flex-wrap gap-2">
                  {(["relaxed", "moderate", "fast"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPace(option)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        pace === option
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                      )}
                    >
                      {PACE_LABELS[option]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400">
                  {pace
                    ? PACE_DESCRIPTIONS[pace]
                    : "How packed should each day feel?"}
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="end-day-by">End the day by what time?</Label>
                <Input
                  id="end-day-by"
                  type="time"
                  value={endDayByTime}
                  onChange={(e) => setEndDayByTime(e.target.value)}
                  className="max-w-[160px]"
                />
                <p className="text-xs text-neutral-400">
                  We&apos;ll plan activities to finish before this time each
                  day.
                </p>
              </div>

              <div className="space-y-4">
                <Label>Food preference</Label>
                <div className="flex flex-wrap gap-2">
                  {(["pure_veg", "veg", "non_veg", "any"] as const).map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDietary(option)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          dietary === option
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                        )}
                      >
                        {DIETARY_LABELS[option]}
                      </button>
                    ),
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  {dietary
                    ? DIETARY_DESCRIPTIONS[dietary]
                    : "What kind of restaurants should we plan around?"}
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="trip-preferences">Anything else?</Label>
                <Textarea
                  id="trip-preferences"
                  placeholder="Must-dos, vibe, accessibility needs…"
                  value={preferences}
                  onChange={(e) =>
                    setPreferences(e.target.value.slice(0, 1000))
                  }
                  rows={4}
                  className="resize-none"
                />
                <p className="text-right text-xs text-neutral-400">
                  {preferences.length}/1000 characters
                </p>
              </div>
            </div>

            {(tripLimitReached || createError) && (
              <div
                className={cn(
                  "mt-6 rounded-xl border p-3 text-sm",
                  tripLimitReached
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-red-200 bg-red-50 text-red-700",
                )}
              >
                {tripLimitReached ? getTripLimitMessage() : createError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="mt-8 mb-2 h-14 w-full px-10 py-2 text-base cursor-pointer"
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
