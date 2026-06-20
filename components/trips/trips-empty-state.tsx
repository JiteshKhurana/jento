import { Compass, Sparkles } from "lucide-react";
import { NewTripButton } from "@/components/trips/new-trip-button";

export function TripsEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-blue-50/50 via-transparent to-transparent dark:from-white/5" />

      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg dark:bg-white">
        <Compass className="h-7 w-7 text-primary-foreground dark:text-black" />
      </div>

      <h2 className="relative mt-6 text-2xl font-semibold tracking-tight text-foreground">
        Your next adventure awaits
      </h2>
      <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
        Tell us where you want to go and we&apos;ll build a personalized
        day-by-day itinerary
      </p>

      <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <NewTripButton
          label="Plan your first trip"
          size="lg"
          className="cursor-pointer"
          showIcon={false}
        />
      </div>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI-powered itineraries
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>Interactive maps</span>
        <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
        <span>Editable day plans</span>
      </div>
    </div>
  );
}
