"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Check,
  MapPin,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteTripDialog } from "@/components/trips/delete-trip-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatTripLocationLabel,
  getTripLocations,
} from "@/lib/trips/preferences";
import { cn } from "@/lib/utils";

const COVER_GRADIENTS = [
  "from-sky-500 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-violet-500 to-purple-700",
  "from-neutral-500 to-neutral-900",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-indigo-700",
] as const;

function destinationGradient(
  destination: string,
): (typeof COVER_GRADIENTS)[number] {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = destination.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

type TripCardProps = {
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string | Date | null;
    endDate: string | Date | null;
    updatedAt: string | Date;
    preferences?: unknown;
    itineraries?: Array<{ days: Array<{ items: unknown[] }> }>;
  };
  coverPhoto?: { url: string; alt: string } | null;
  priority?: boolean;
};

function TripDestinationBadge({
  destination,
  preferences,
}: {
  destination: string;
  preferences?: unknown;
}) {
  const locations = getTripLocations(preferences);

  if (locations.length <= 1) {
    return <span>{destination}</span>;
  }

  return (
    <span className="flex max-w-full flex-wrap items-center gap-x-1 gap-y-0.5">
      {locations.map((location, index) => (
        <span
          key={`${location.name}-${index}`}
          className="inline-flex items-center gap-1"
        >
          {index > 0 && (
            <ArrowRight className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          )}
          <span>{formatTripLocationLabel(location)}</span>
        </span>
      ))}
    </span>
  );
}

export function TripCard({ trip, coverPhoto, priority }: TripCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const itemCount =
    trip.itineraries?.[0]?.days.reduce(
      (acc, day) => acc + day.items.length,
      0,
    ) ?? 0;
  const dayCount = trip.itineraries?.[0]?.days.length ?? 0;

  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;
  const tripDuration = start && end ? differenceInDays(end, start) + 1 : null;

  const gradient = destinationGradient(trip.destination);

  async function handleShare() {
    const url = `${window.location.origin}/trips/${trip.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: trip.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
    setMenuOpen(false);
  }

  function openDeleteDialog() {
    setMenuOpen(false);
    setDeleteDialogOpen(true);
  }

  return (
    <>
      <Card className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-card hover:text-foreground cursor-pointer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Trip options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-44 p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent cursor-pointer"
              onClick={handleShare}
            >
              {shared ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {shared ? "Link copied" : "Share trip"}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
              onClick={openDeleteDialog}
            >
              <Trash2 className="h-4 w-4" />
              Delete trip
            </button>
          </PopoverContent>
        </Popover>

        <Link href={`/trips/${trip.id}`} className="block">
          <div className="relative aspect-video overflow-hidden">
            {coverPhoto ? (
              <Image
                src={coverPhoto.url}
                alt={coverPhoto.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={priority}
              />
            ) : (
              <div
                className={cn("absolute inset-0 bg-linear-to-br", gradient)}
              />
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/5" />

            <div className="absolute left-4 top-4 max-w-[calc(100%-3.5rem)]">
              <Badge
                variant="outline"
                className="max-w-full border-white/20 bg-white/15 text-white backdrop-blur-sm"
              >
                <TripDestinationBadge
                  destination={trip.destination}
                  preferences={trip.preferences}
                />
              </Badge>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white">
                {trip.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {(start || end) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {start ? format(start, "MMM d") : "TBD"}
                  {" – "}
                  {end ? format(end, "MMM d, yyyy") : "TBD"}
                  {tripDuration != null && tripDuration > 0 && (
                    <span className="text-muted-foreground">
                      · {tripDuration}d
                    </span>
                  )}
                </span>
              )}
              {(itemCount > 0 || dayCount > 0) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {dayCount > 0 &&
                    `${dayCount} ${dayCount === 1 ? "day" : "days"}`}
                  {dayCount > 0 && itemCount > 0 && ", "}
                  {itemCount > 0 && `${itemCount} stops`}
                </span>
              )}
              {!start && !end && itemCount === 0 && dayCount === 0 && (
                <span className="text-muted-foreground">No itinerary yet</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:block">
                {formatDistanceToNow(new Date(trip.updatedAt), {
                  addSuffix: true,
                })}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </div>
        </Link>
      </Card>

      <DeleteTripDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tripId={trip.id}
        tripTitle={trip.title}
      />
    </>
  );
}
