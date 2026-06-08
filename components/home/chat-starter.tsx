"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TripIntakeBar } from "@/components/trips/trip-intake-bar";
import { PopularDestinations } from "@/components/home/popular-destinations";
import { LoadingState } from "@/components/ui/spinner";
import {
  buildTripPayload,
  type TripIntakeData,
} from "@/lib/trips/intake";
import { cn } from "@/lib/utils";

type ChatStarterProps = {
  signedIn: boolean;
  className?: string;
  showPopularDestinations?: boolean;
};

export function ChatStarter({ signedIn, className, showPopularDestinations = false }: ChatStarterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState("");

  async function handleSubmit(data: TripIntakeData) {
    if (loading) return;

    if (!signedIn) {
      router.push(`/sign-up?redirect=${encodeURIComponent("/")}`);
      return;
    }

    setLoading(true);
    const payload = buildTripPayload(data);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          destination: payload.destination,
          startDate: payload.startDate,
          endDate: payload.endDate,
          preferences: payload.preferences,
        }),
      });

      if (!res.ok) throw new Error("Failed to create trip");

      const trip = await res.json();
      router.push(
        `/trips/${trip.id}?q=${encodeURIComponent(payload.initialMessage)}`,
      );
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-3xl", className)}>
      <TripIntakeBar
        key={destinationQuery}
        onSubmit={handleSubmit}
        loading={loading}
        initialDestinationQuery={destinationQuery}
      />
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <LoadingState label="Creating your trip…" />
        </div>
      )}
      {showPopularDestinations && !loading && (
        <div className="mt-4">
          <PopularDestinations onSelect={setDestinationQuery} />
        </div>
      )}
    </div>
  );
}
