"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DestinationAutocomplete,
  type SelectedLocation,
} from "@/components/trips/destination-autocomplete";
import { getCreateTripErrorMessage } from "@/lib/trips/limits";

const ease = [0.22, 1, 0.36, 1] as const;

interface LandingTryOutSectionProps {
  userId: string | null;
}

export function LandingTryOutSection({ userId }: LandingTryOutSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(location: SelectedLocation) {
    if (!userId) {
      router.push(`/sign-up?redirect=${encodeURIComponent("/inspire")}`);
      return;
    }

    setCreating(true);
    setError(null);

    const destinationName = location.name;
    const initialMessage = `Plan my trip to ${destinationName}`;

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${destinationName} trip`,
          destination: destinationName,
          startDate: null,
          endDate: null,
          preferences: null,
        }),
      });

      if (!res.ok) {
        throw new Error(await getCreateTripErrorMessage(res));
      }

      const trip = await res.json();
      if (typeof pendo !== "undefined") {
        pendo.track("landing_quick_trip_created", {
          destination: destinationName,
          tripId: trip.id,
        });
      }
      router.push(
        `/trips/${trip.id}?q=${encodeURIComponent(initialMessage)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setCreating(false);
    }
  }

  return (
    <section className="my-16 px-3 py-24 sm:my-20 sm:px-5 md:my-24 md:px-6 md:py-32 lg:my-28 lg:py-40">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease }}
        className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[min(100%,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full opacity-40 sm:size-224 lg:size-256"
          style={{
            background:
              "radial-gradient(circle closest-side at center, rgb(255 162 0 / 100%) 0%, rgb(255 162 0 / 0%) 100%)",
          }}
        />

        <h2 className="relative font-francois text-3xl leading-[1.14] text-foreground sm:text-4xl lg:text-5xl">
          Try Out Now
        </h2>

        <div className="relative w-full max-w-2xl">
          <DestinationAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleSelect}
            placeholder="Search a Destination"
            leadingIcon="search"
            leadingIconClassName="dark:text-white"
            disabled={creating}
            inputClassName="h-14 rounded-full border-0 bg-card text-base text-foreground shadow-sm ring-1 ring-border placeholder:text-muted-foreground dark:placeholder:text-white focus-visible:border-ring focus-visible:ring-ring/60"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </motion.div>
    </section>
  );
}
