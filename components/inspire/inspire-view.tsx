"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plane } from "lucide-react";
import { DestinationCard } from "@/components/inspire/destination-card";
import { ItineraryTemplateCard } from "@/components/inspire/itinerary-template-card";
import {
  FEATURED_DESTINATIONS,
  ITINERARY_TEMPLATES,
  TRAVEL_CATEGORIES,
  type TravelCategory,
} from "@/lib/inspire/templates";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";
import { cn } from "@/lib/utils";

type Props = {
  destinationPhotos: Record<string, UnsplashPhoto | null>;
  templatePhotos: Record<string, UnsplashPhoto | null>;
  signedIn: boolean;
};

export function InspireView({ destinationPhotos, templatePhotos, signedIn }: Props) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TravelCategory>("all");
  const [creating, setCreating] = useState<string | null>(null);

  const filteredDestinations =
    activeCategory === "all"
      ? FEATURED_DESTINATIONS
      : FEATURED_DESTINATIONS.filter((d) => d.categories.includes(activeCategory));

  const filteredTemplates =
    activeCategory === "all"
      ? ITINERARY_TEMPLATES
      : ITINERARY_TEMPLATES.filter((t) => t.categories.includes(activeCategory));

  async function handlePlanTrip(message: string, destinationName: string) {
    if (!signedIn) {
      router.push(`/sign-up?redirect=${encodeURIComponent("/inspire")}`);
      return;
    }

    setCreating(destinationName);

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

      if (!res.ok) throw new Error("Failed to create trip");

      const trip = await res.json();
      router.push(`/trips/${trip.id}?q=${encodeURIComponent(message)}`);
    } catch {
      setCreating(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-hero px-6 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-700 mb-4">
            <Plane className="h-3 w-3" />
            Popular destinations & itineraries
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-6xl">
            Get <span className="text-gradient-warm">inspired.</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-500">
            Explore popular destinations and ready-made itineraries. One click to start planning.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {TRAVEL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "tag-pill",
                activeCategory === cat.id ? "tag-pill-active" : "tag-pill-inactive",
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Creating overlay */}
      {creating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
          <p className="font-medium text-neutral-700">Creating your {creating} trip…</p>
        </div>
      )}

      {/* Destinations Grid */}
      <section className="px-6 py-14 md:px-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-2xl font-bold text-neutral-900">
            {activeCategory === "all" ? "Popular destinations" : `${TRAVEL_CATEGORIES.find(c => c.id === activeCategory)?.emoji} ${TRAVEL_CATEGORIES.find(c => c.id === activeCategory)?.label} destinations`}
          </h2>

          {filteredDestinations.length === 0 ? (
            <p className="py-12 text-center text-neutral-400">
              No destinations in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filteredDestinations.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  photo={destinationPhotos[dest.id] ?? null}
                  onPlanTrip={handlePlanTrip}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Itinerary Templates */}
      {filteredTemplates.length > 0 && (
        <section className="px-6 pb-20 md:px-12" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-7xl pt-14">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900">Popular itineraries</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Ready-made itineraries you can customize instantly
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <ItineraryTemplateCard
                  key={template.id}
                  template={template}
                  photo={templatePhotos[template.id] ?? null}
                  onPlanTrip={handlePlanTrip}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
