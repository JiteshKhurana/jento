import type { BudgetTier } from "@/lib/trips/intake";

const BUDGET_SEARCH_HINTS: Record<BudgetTier, string> = {
  budget: "cheap affordable budget",
  moderate: "mid-range moderate",
  upscale: "upscale premium",
  luxury: "luxury high-end",
};

export function applyBudgetToQuery(
  query: string,
  budget?: BudgetTier | null,
): string {
  if (!budget) return query;
  return `${BUDGET_SEARCH_HINTS[budget]} ${query}`;
}
