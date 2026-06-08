"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { IdeasPanel } from "@/components/ideas/ideas-panel";
import {
  DayTimeline,
  type ItineraryDayData,
} from "@/components/itinerary/day-timeline";
import { TripCalendar } from "@/components/itinerary/trip-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCurrentLocation } from "@/lib/locations/get-current-location";
import {
  getStartingLocation,
  isRoadTrip,
  parseTripPreferences,
  type TripPreferences,
} from "@/lib/trips/preferences";

const TripMap = dynamic(
  () => import("@/components/map/trip-map").then((m) => m.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-neutral-100">
        <LoadingState label="Loading map…" />
      </div>
    ),
  },
);

type TripPlannerProps = {
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    preferences?: TripPreferences | null;
    messages: Array<{ role: string; content: string }>;
    itineraries: Array<{ days: ItineraryDayData[] }>;
  };
  initialQuery?: string | null;
  isOwner?: boolean;
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

async function fetchItineraryDays(tripId: string) {
  const res = await fetch(`/api/trips/${tripId}/itinerary`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.days ?? []) as ItineraryDayData[];
}

export function TripPlanner({
  trip: initialTrip,
  initialQuery = null,
  isOwner = true,
}: TripPlannerProps) {
  const [trip, setTrip] = useState(initialTrip);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | null>(null);
  const [leftView, setLeftView] = useState<"chat" | "itinerary" | "ideas">(
    isOwner ? "chat" : "itinerary",
  );
  const [rightView, setRightView] = useState<"map" | "calendar">("map");
  const [selectedDay, setSelectedDay] = useState<number | undefined>(
    () => initialTrip.itineraries[0]?.days[0]?.dayNumber,
  );
  const [refreshing, setRefreshing] = useState(false);
  const isDesktop = useIsDesktop();

  const days = trip.itineraries[0]?.days ?? [];
  const filteredMessages = trip.messages.filter((m) => m.role !== "SYSTEM");

  useEffect(() => {
    if (!isOwner) {
      setChatInitialQuery(null);
      return;
    }

    if (!initialQuery) {
      setChatInitialQuery(null);
      return;
    }

    if (!isRoadTrip(trip.preferences) || getStartingLocation(trip.preferences)) {
      setChatInitialQuery(initialQuery);
      return;
    }

    let cancelled = false;

    getCurrentLocation().then(async (startingLocation) => {
      if (cancelled) return;

      if (startingLocation) {
        const mergedPreferences = {
          ...parseTripPreferences(trip.preferences),
          startingLocation,
        };

        const res = await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: mergedPreferences }),
        });

        if (!cancelled && res.ok) {
          setTrip((current) => ({
            ...current,
            preferences: mergedPreferences,
          }));
        }
      }

      const startingNote = startingLocation
        ? ` Starting from ${startingLocation.label || startingLocation.name}.`
        : "";
      setChatInitialQuery(
        initialQuery.includes("Starting from")
          ? initialQuery
          : `${initialQuery}${startingNote}`,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [isOwner, initialQuery, trip.id, trip.preferences]);

  const refreshItinerary = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchMeta = async () => {
        const res = await fetch(`/api/trips/${trip.id}?view=meta`);
        return res.ok ? res.json() : null;
      };

      let meta = await fetchMeta();
      let itineraryDays = await fetchItineraryDays(trip.id);

      if (meta?.status === "READY" && itineraryDays.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        meta = await fetchMeta();
        itineraryDays = await fetchItineraryDays(trip.id);
      }

      if (!meta) return;

      setTrip((prev) => ({
        ...prev,
        status: meta.status,
        title: meta.title,
        itineraries: [{ days: itineraryDays }],
      }));

      if (itineraryDays.length > 0) {
        setSelectedDay((current) => current ?? itineraryDays[0]?.dayNumber);
      }
    } finally {
      setRefreshing(false);
    }
  }, [trip.id]);

  function handleSelectItem(itemId: string) {
    setSelectedItemId(itemId);
    setLeftView("itinerary");
    setTimeout(() => {
      document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  const chatPanel = (
    <ChatPanel
      tripId={trip.id}
      initialQuery={chatInitialQuery}
      initialMessages={filteredMessages}
      onItineraryUpdate={isOwner ? refreshItinerary : undefined}
      readOnly={!isOwner}
    />
  );

  const ideasPanel = (
    <IdeasPanel
      tripId={trip.id}
      destination={trip.destination}
      days={days}
      onItineraryUpdate={isOwner ? refreshItinerary : undefined}
      readOnly={!isOwner}
    />
  );

  const itineraryPanel = (
    <div className="relative min-h-full">
      {refreshing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <LoadingState label="Updating itinerary…" />
        </div>
      )}
      {days.length > 1 && (
        <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-neutral-100 bg-white px-4 py-3">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDay(day.dayNumber)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                selectedDay === day.dayNumber
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
              )}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      )}
      <DayTimeline
        tripId={trip.id}
        days={days}
        onUpdate={isOwner ? refreshItinerary : undefined}
        onSelectItem={handleSelectItem}
        selectedDay={selectedDay}
        readOnly={!isOwner}
      />
    </div>
  );

  const totalItems = days.reduce((n, d) => n + d.items.length, 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      <AppHeader />

      {!isOwner && (
        <div className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 md:px-6">
          You&apos;re viewing a shared trip. Only the owner can make changes.
        </div>
      )}

      {/* Trip header bar */}
      <div className="shrink-0 border-b border-neutral-200/80 bg-white px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="text-base font-semibold text-neutral-900">{trip.title}</h1>
          <Badge variant={trip.status === "READY" ? "success" : "secondary"}>
            {trip.status === "READY" ? "Ready" : "Planning"}
          </Badge>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              {trip.destination}
            </span>
            {trip.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-teal-500" />
                {format(new Date(trip.startDate), "MMM d")}
                {trip.endDate && ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {isDesktop === null ? (
        <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-[minmax(380px,42%)_1fr]">
          <div className="space-y-4 border-r border-neutral-200/80 bg-white p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      ) : isDesktop ? (
        <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-[minmax(380px,42%)_1fr]">
          <div className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-200/80 bg-white">
            {/* Pill-style tab switcher */}
            <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-3">
              <div className="flex rounded-xl bg-neutral-100 p-1">
                {(["chat", "itinerary", "ideas"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setLeftView(view)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      leftView === view
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700",
                    )}
                  >
                    {view === "chat" && "Chat"}
                    {view === "itinerary" && (
                      <>
                        Itinerary
                        {totalItems > 0 && (
                          <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                            {totalItems}
                          </span>
                        )}
                      </>
                    )}
                    {view === "ideas" && "Ideas"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 flex flex-col",
                  leftView !== "chat" && "pointer-events-none invisible",
                )}
              >
                {chatPanel}
              </div>
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto",
                  leftView !== "itinerary" && "pointer-events-none invisible",
                )}
              >
                {itineraryPanel}
              </div>
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto",
                  leftView !== "ideas" && "pointer-events-none invisible",
                )}
              >
                {ideasPanel}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            {/* Map / Calendar toggle */}
            <div className="shrink-0 border-b border-neutral-200/80 bg-white px-3 py-2">
              <div className="flex rounded-lg bg-neutral-100 p-0.5">
                {(["map", "calendar"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRightView(v)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      rightView === v
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700",
                    )}
                  >
                    {v === "map" ? (
                      <>
                        <MapPin className="h-3.5 w-3.5" />
                        Map
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3.5 w-3.5" />
                        Calendar
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-neutral-100">
              {rightView === "map" ? (
                <TripMap
                  days={days}
                  destination={trip.destination}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                />
              ) : (
                <TripCalendar days={days} tripStartDate={trip.startDate} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs
            defaultValue={isOwner ? "chat" : "itinerary"}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 px-4 pt-3">
              <TabsList className="grid w-full grid-cols-5 rounded-xl bg-neutral-100 p-1">
                <TabsTrigger value="chat" className="rounded-lg text-xs">Chat</TabsTrigger>
                <TabsTrigger value="itinerary" className="rounded-lg text-xs">
                  Plan
                  {totalItems > 0 && (
                    <span className="ml-1 rounded-full bg-orange-100 px-1 py-0 text-[10px] font-bold text-orange-700">
                      {totalItems}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ideas" className="rounded-lg text-xs">
                  Ideas
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-lg text-xs">Cal</TabsTrigger>
                <TabsTrigger value="map" className="rounded-lg text-xs">Map</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="chat"
              className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden data-[state=active]:flex-col"
            >
              {chatPanel}
            </TabsContent>
            <TabsContent value="itinerary" className="flex-1 overflow-auto">
              {itineraryPanel}
            </TabsContent>
            <TabsContent value="ideas" className="flex-1 overflow-auto">
              {ideasPanel}
            </TabsContent>
            <TabsContent value="calendar" className="flex-1 overflow-hidden">
              <TripCalendar days={days} tripStartDate={trip.startDate} />
            </TabsContent>
            <TabsContent value="map" className="flex-1">
              <TripMap
                days={days}
                destination={trip.destination}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
