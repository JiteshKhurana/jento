"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { DateRange } from "react-day-picker";
import {
  DestinationAutocomplete,
  type SelectedLocation,
} from "@/components/trips/destination-autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BUDGET_LABELS,
  TRAVELER_LABELS,
  formatTravelerSummary,
  formatWhenSummary,
  isTripIntakeComplete,
  type BudgetTier,
  type TimingMode,
  type TravelerType,
  type TripIntakeData,
} from "@/lib/trips/intake";
import { cn } from "@/lib/utils";

type IntakeField = "where" | "when" | "who" | "budget";

type TripIntakeBarProps = {
  onSubmit: (data: TripIntakeData) => void;
  loading?: boolean;
  className?: string;
  initialDestinationQuery?: string;
};

const TRAVELER_TYPES: TravelerType[] = [
  "solo",
  "couple",
  "friends",
  "family",
  "group",
];

const BUDGET_TIERS: BudgetTier[] = ["budget", "moderate", "upscale", "luxury"];

function Segment({ label, value }: { label: string; value: string | null }) {
  if (value) {
    return (
      <div className="min-w-0 flex-1 px-4 py-3.5 text-left">
        <p className="truncate text-sm font-medium text-neutral-900">{value}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 px-4 py-3.5 text-left">
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}

export function TripIntakeBar({ onSubmit, loading, className, initialDestinationQuery }: TripIntakeBarProps) {
  const [openField, setOpenField] = useState<IntakeField | null>("where");
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialDestinationQuery ?? "");
  const [timingMode, setTimingMode] = useState<TimingMode>("dates");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [flexibleDays, setFlexibleDays] = useState("");
  const [travelerType, setTravelerType] = useState<TravelerType | null>(null);
  const [travelerCount, setTravelerCount] = useState("");
  const [budget, setBudget] = useState<BudgetTier | null>(null);

  const intake: TripIntakeData = {
    location,
    timingMode,
    dateRange: dateRange?.from
      ? { from: dateRange.from, to: dateRange.to }
      : undefined,
    flexibleDays: flexibleDays ? Number(flexibleDays) : undefined,
    travelerType,
    travelerCount: travelerCount ? Number(travelerCount) : undefined,
    budget,
  };

  const whereSummary = location
    ? location.label.split(",").slice(0, 2).join(",").trim() || location.name
    : null;
  const whenSummary = formatWhenSummary(intake);
  const whoSummary = travelerType
    ? formatTravelerSummary(
        travelerType,
        travelerCount ? Number(travelerCount) : undefined,
      )
    : null;
  const budgetSummary = budget ? BUDGET_LABELS[budget] : null;

  function handleLocationSelect(selected: SelectedLocation) {
    setLocation(selected);
    setSearchQuery("");
    setOpenField("when");
  }

  function handleTravelerSelect(type: TravelerType) {
    setTravelerType(type);
    if (type === "solo" || type === "couple" || type === "family") {
      setTravelerCount("");
      setOpenField("budget");
    }
  }

  function handleBudgetSelect(tier: BudgetTier) {
    setBudget(tier);
    setOpenField(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTripIntakeComplete(intake) || loading) return;
    onSubmit(intake);
  }

  function advanceFromWhen() {
    if (timingMode === "flexible" && flexibleDays.trim()) {
      setOpenField("who");
    } else if (timingMode === "dates" && dateRange?.from) {
      setOpenField("who");
    }
  }

  const segments: Array<{
    id: IntakeField;
    label: string;
    summary: string | null;
  }> = [
    { id: "where", label: "Where", summary: whereSummary },
    { id: "when", label: "When", summary: whenSummary },
    { id: "who", label: "Who", summary: whoSummary },
    { id: "budget", label: "Budget", summary: budgetSummary },
  ];

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="chat-input-shadow overflow-x-auto rounded-full border border-neutral-200/80 bg-white">
        <div className="flex min-w-[520px] items-stretch">
        {segments.map((segment, index) => (
          <div key={segment.id} className="flex min-w-0 flex-1 items-stretch">
            {index > 0 && <div className="w-px self-stretch bg-neutral-200" />}
            <Popover
              open={openField === segment.id}
              onOpenChange={(open) => setOpenField(open ? segment.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center transition-colors hover:bg-neutral-50/80"
                >
                  <Segment label={segment.label} value={segment.summary} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[min(calc(100vw-2rem),320px)] p-4 sm:w-80"
              >
                {segment.id === "where" && (
                  <div className="space-y-3">
                    <Label>Where to?</Label>
                    <DestinationAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSelect={handleLocationSelect}
                      placeholder="Search cities or countries…"
                      autoFocus
                    />
                    {location && (
                      <p className="text-sm text-neutral-600">
                        Selected:{" "}
                        <span className="font-medium text-neutral-900">
                          {whereSummary}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {segment.id === "when" && (
                  <div className="space-y-3">
                    <Label>When?</Label>
                    <div className="flex gap-2">
                      {(["dates", "flexible"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTimingMode(mode)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            timingMode === mode
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
                          )}
                        >
                          {mode === "dates" ? "Dates" : "Flexible"}
                        </button>
                      ))}
                    </div>

                    {timingMode === "flexible" ? (
                      <div className="space-y-2">
                        <Label htmlFor="flex-days" className="font-normal text-neutral-600">
                          How many days?
                        </Label>
                        <Input
                          id="flex-days"
                          type="number"
                          min={1}
                          max={365}
                          placeholder="e.g. 5"
                          value={flexibleDays}
                          onChange={(e) => setFlexibleDays(e.target.value)}
                        />
                      </div>
                    ) : (
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        disabled={{ before: new Date() }}
                        className="rounded-xl border border-neutral-100 p-2"
                      />
                    )}

                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={advanceFromWhen}
                      disabled={
                        timingMode === "flexible"
                          ? !flexibleDays.trim()
                          : !dateRange?.from
                      }
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {segment.id === "who" && (
                  <div className="space-y-3">
                    <Label>Who&apos;s going?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TRAVELER_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTravelerSelect(type)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                            travelerType === type
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
                          )}
                        >
                          {TRAVELER_LABELS[type]}
                        </button>
                      ))}
                    </div>

                    {(travelerType === "friends" || travelerType === "group") && (
                      <div className="space-y-2">
                        <Label htmlFor="traveler-count" className="font-normal text-neutral-600">
                          How many people?
                        </Label>
                        <Input
                          id="traveler-count"
                          type="number"
                          min={2}
                          max={50}
                          placeholder={travelerType === "friends" ? "e.g. 4" : "e.g. 8"}
                          value={travelerCount}
                          onChange={(e) => setTravelerCount(e.target.value)}
                        />
                      </div>
                    )}

                    {(travelerType === "friends" || travelerType === "group") && (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() => setOpenField("budget")}
                        disabled={!travelerCount.trim()}
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                )}

                {segment.id === "budget" && (
                  <div className="space-y-3">
                    <Label>Budget</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_TIERS.map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleBudgetSelect(tier)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                            budget === tier
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
                          )}
                        >
                          {BUDGET_LABELS[tier]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        ))}

        <div className="flex shrink-0 items-center pr-2 pl-1">
          <Button
            type="submit"
            size="icon"
            disabled={loading || !isTripIntakeComplete(intake)}
            className="h-10 w-10 rounded-full"
            aria-label={loading ? "Creating trip…" : "Start planning"}
          >
            {loading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-neutral-400">
        {isTripIntakeComplete(intake)
          ? "Ready to plan — hit send to start"
          : "Fill in where, when, who, and budget to begin"}
      </p>
    </form>
  );
}
