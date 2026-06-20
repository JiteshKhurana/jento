import { format } from "date-fns";
import type { SelectedLocation } from "@/components/trips/destination-autocomplete";
import { toCalendarDateISO } from "@/lib/trips/dates";
import type { DietaryPreference, TripPace } from "@/lib/trips/preferences";

export type { DietaryPreference, TripPace };

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

export const PACE_LABELS: Record<TripPace, string> = {
  relaxed: "Relaxed",
  moderate: "Moderate",
  fast: "Fast-paced",
};

export const PACE_DESCRIPTIONS: Record<TripPace, string> = {
  relaxed: "Fewer stops, more downtime",
  moderate: "Balanced mix of sights and rest",
  fast: "Packed schedule, see as much as possible",
};

export const DIETARY_LABELS: Record<DietaryPreference, string> = {
  pure_veg: "Pure veg",
  veg: "Veg",
  non_veg: "Non-veg",
  any: "Anything works",
};

export const DIETARY_DESCRIPTIONS: Record<DietaryPreference, string> = {
  pure_veg: "Strictly vegetarian — no eggs, meat, or fish",
  veg: "Vegetarian meals preferred",
  non_veg: "Non-vegetarian options welcome",
  any: "No dietary restrictions",
};

export const BUDGET_LABELS: Record<BudgetTier, string> = {
  budget: "Budget",
  moderate: "Moderate",
  upscale: "Upscale",
  luxury: "Luxury",
};

export type BudgetCurrency = {
  code: string;
  symbol: string;
  label: string;
};

export const DEFAULT_BUDGET_CURRENCY = "INR";
export const DEFAULT_END_DAY_BY = "22:00";

export function formatEndDayBySummary(time24: string): string {
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

export const BUDGET_CURRENCIES: BudgetCurrency[] = [
  { code: "INR", symbol: "₹", label: "INR" },
  { code: "USD", symbol: "$", label: "USD" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
  { code: "JPY", symbol: "¥", label: "JPY" },
  { code: "AUD", symbol: "A$", label: "AUD" },
  { code: "CAD", symbol: "C$", label: "CAD" },
  { code: "SGD", symbol: "S$", label: "SGD" },
];

export function getCurrencySymbol(code: string): string {
  return BUDGET_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatBudgetAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export type TripIntakeData = {
  location: SelectedLocation | null;
  timingMode: TimingMode;
  dateRange?: { from: Date; to?: Date };
  flexibleDays?: number;
  travelerType: TravelerType | null;
  travelerCount?: number;
  pace: TripPace | null;
  dietary: DietaryPreference | null;
  budgetPerPerson: number | null;
  budgetCurrency: string;
};

export function formatTravelerSummary(
  type: TravelerType,
  count?: number,
): string {
  if (type === "solo") return "Solo";
  if (type === "couple") return "Couple";
  if (type === "family") {
    return count && count > 0 ? `Family of ${count}` : "Family";
  }
  const n = count && count > 0 ? count : type === "friends" ? 2 : 4;
  return `${n} ${type}`;
}

export function travelerTypeRequiresCount(
  type: TravelerType | null | undefined,
): boolean {
  return type === "friends" || type === "group" || type === "family";
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
  if (
    !data.location ||
    !data.budgetPerPerson ||
    data.budgetPerPerson <= 0 ||
    !data.travelerType ||
    !data.pace ||
    !data.dietary
  ) {
    return false;
  }
  if (
    travelerTypeRequiresCount(data.travelerType) &&
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
    pace: data.pace ?? null,
    dietary: data.dietary ?? null,
    budgetPerPerson: data.budgetPerPerson ?? null,
    budgetCurrency: data.budgetCurrency,
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

  if (data.budgetPerPerson && data.budgetPerPerson > 0) {
    const symbol = getCurrencySymbol(data.budgetCurrency);
    parts.push(`Budget of ${symbol}${data.budgetPerPerson.toLocaleString()} per person.`);
  }

  if (data.pace) {
    parts.push(`Prefer a ${PACE_LABELS[data.pace].toLowerCase()} pace (${PACE_DESCRIPTIONS[data.pace].toLowerCase()}).`);
  }

  if (data.dietary) {
    parts.push(`Dietary preference: ${DIETARY_LABELS[data.dietary].toLowerCase()} (${DIETARY_DESCRIPTIONS[data.dietary].toLowerCase()}).`);
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
    startDate = toCalendarDateISO(data.dateRange.from);
    endDate = toCalendarDateISO(data.dateRange.to ?? data.dateRange.from);
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
