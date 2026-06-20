"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BUDGET_LABELS, type BudgetTier } from "@/lib/trips/intake";
import { cn } from "@/lib/utils";

const BUDGET_TIERS: BudgetTier[] = ["budget", "moderate", "upscale", "luxury"];

type ExploreFiltersProps = {
  budget: BudgetTier | null;
  onBudgetChange: (budget: BudgetTier | null) => void;
};

export function ExploreFilters({
  budget,
  onBudgetChange,
}: ExploreFiltersProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "relative h-11 w-11 shrink-0 rounded-xl cursor-pointer",
            budget && "border-neutral-900",
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {budget && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neutral-900" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Budget</p>
            {budget && (
              <button
                type="button"
                onClick={() => onBudgetChange(null)}
                className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onBudgetChange(budget === tier ? null : tier)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
