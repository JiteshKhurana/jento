import { format } from "date-fns";
import type { SelectedLocation } from "@/components/trips/destination-autocomplete";

export type TravelerType = "solo" | "couple" | "friends" | "family" | "group";
export type BudgetTier = "budget" | "moderate" | "upscale" | "luxury";
export type TimingMode = "flexible" | "dates";

export const TRAVELER_LABELS: Record<TravelerType, string> = {
  solo: "Solo",
  couple: "Couple",
  friends: "Friends",
  family: "Family",
  group: "Group",
};

export const BUDGET_LABELS: Record<BudgetTier, string> = {
  budget: "Budget",
  moderate: "Moderate",
  upscale: "Upscale",
  luxury: "Luxury",
};

export type TripIntakeData = {
  location: SelectedLocation | null;
  timingMode: TimingMode;
  dateRange?: { from: Date; to?: Date };
  flexibleDays?: number;
  travelerType: TravelerType | null;
  travelerCount?: number;
  budget: BudgetTier | null;
};

export function formatTravelerSummary(
  type: TravelerType,
  count?: number,
): string {
  if (type === "solo") return "Solo";
  if (type === "couple") return "Couple";
  if (type === "family") return "Family";
  const n = count && count > 0 ? count : type === "friends" ? 2 : 4;
  return `${n} ${type}`;
}

export function formatWhenSummary(data: TripIntakeData): string | null {
  if (data.timingMode === "flexible" && data.flexibleDays) {
    return `${data.flexibleDays} days, flexible`;
  }
  if (data.timingMode === "dates" && data.dateRange?.from) {
    const from = data.dateRange.from;
    const to = data.dateRange.to ?? from;
    return to.getTime() === from.getTime()
      ? format(from, "MMM d, yyyy")
      : `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
  }
  return null;
}

export function isTripIntakeComplete(data: TripIntakeData): boolean {
  if (!data.location || !data.budget || !data.travelerType) return false;
  if (
    (data.travelerType === "friends" || data.travelerType === "group") &&
    (!data.travelerCount || data.travelerCount < 2)
  ) {
    return false;
  }
  if (data.timingMode === "flexible") return !!data.flexibleDays && data.flexibleDays > 0;
  return !!data.dateRange?.from;
}

export function buildTripPreferences(data: TripIntakeData) {
  return {
    locations: data.location ? [data.location] : [],
    timingMode: data.timingMode,
    flexibleDays:
      data.timingMode === "flexible" ? data.flexibleDays ?? null : null,
    travelers: data.travelerType
      ? {
          type: data.travelerType,
          count: data.travelerCount ?? null,
        }
      : null,
    budget: data.budget,
  };
}

export function buildTripInitialMessage(data: TripIntakeData): string {
  const destination =
    data.location?.label.split(",").slice(0, 2).join(",").trim() ??
    data.location?.name ??
    "";

  const parts: string[] = [`Plan a trip to ${destination}.`];

  const when = formatWhenSummary(data);
  if (when) {
    parts.push(
      data.timingMode === "flexible"
        ? `Flexible timing, about ${data.flexibleDays} days.`
        : `Dates: ${when}.`,
    );
  }

  if (data.travelerType) {
    parts.push(
      `Traveling as ${formatTravelerSummary(data.travelerType, data.travelerCount).toLowerCase()}.`,
    );
  }

  if (data.budget) {
    parts.push(`${BUDGET_LABELS[data.budget]} budget.`);
  }

  return parts.join(" ");
}

export function buildTripPayload(data: TripIntakeData) {
  const destination =
    data.location?.label.split(",").slice(0, 2).join(",").trim() ??
    data.location?.name ??
    "";

  let startDate: string | null = null;
  let endDate: string | null = null;

  if (data.timingMode === "dates" && data.dateRange?.from) {
    startDate = data.dateRange.from.toISOString();
    endDate = (data.dateRange.to ?? data.dateRange.from).toISOString();
  }

  return {
    title: `${data.location?.name ?? destination} trip`,
    destination,
    startDate,
    endDate,
    preferences: buildTripPreferences(data),
    initialMessage: buildTripInitialMessage(data),
  };
}
