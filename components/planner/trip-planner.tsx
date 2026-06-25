"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CalendarDays,
  Lightbulb,
  MapPin,
  MessageSquare,
  Plane,
  Route,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatPanel } from "@/components/chat/chat-panel";
import { IdeasPanel } from "@/components/ideas/ideas-panel";
import { BookingsPanel } from "@/components/bookings/bookings-panel";
import {
  DayTimeline,
  type ItineraryDayData,
} from "@/components/itinerary/day-timeline";
import { ItemDetailDialog } from "@/components/itinerary/item-detail-dialog";
import { TripCalendar } from "@/components/itinerary/trip-calendar";
import { TripExportMenu } from "@/components/itinerary/trip-export-menu";
import { TripTitleEditor } from "@/components/trips/trip-title-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDayDate } from "@/lib/itinerary/time-utils";
import { getCurrentLocation } from "@/lib/locations/get-current-location";
import { DEFAULT_BUDGET_CURRENCY } from "@/lib/trips/intake";
import {
  getStartingLocation,
  isRoadTrip,
  parseTripPreferences,
  type TripPreferences,
} from "@/lib/trips/preferences";
import type { ChatFollowUp } from "@/lib/chat/follow-up-prompts";

const TripMap = dynamic(
  () => import("@/components/map/trip-map").then((m) => m.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-secondary">
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
    preferences?: TripPreferences | null;
    messages: Array<{ role: string; content: string }>;
    itineraries: Array<{ days: ItineraryDayData[] }>;
  };
  initialQuery?: string | null;
  initialFollowUpPrompts?: ChatFollowUp[] | null;
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
  initialFollowUpPrompts = null,
  isOwner = true,
}: TripPlannerProps) {
  const [trip, setTrip] = useState(initialTrip);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [leftView, setLeftView] = useState<
    "chat" | "itinerary" | "ideas" | "bookings"
  >(isOwner ? "chat" : "itinerary");
  const [rightView, setRightView] = useState<"map" | "calendar">("map");
  const [selectedDay, setSelectedDay] = useState<number | undefined>(
    () => initialTrip.itineraries[0]?.days[0]?.dayNumber,
  );
  const [mapShowAllPlaces, setMapShowAllPlaces] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isDesktop = useIsDesktop();
  const itineraryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    itineraryScrollRef.current?.scrollTo({ top: 0 });
  }, [selectedDay]);

  const days = trip.itineraries[0]?.days ?? [];
  const filteredMessages = trip.messages.filter((m) => m.role !== "SYSTEM");

  const needsLocationEnrichment =
    isOwner &&
    Boolean(initialQuery) &&
    isRoadTrip(trip.preferences) &&
    !getStartingLocation(trip.preferences);

  const [enrichedQuery, setEnrichedQuery] = useState<{
    source: string;
    query: string;
  } | null>(null);

  useEffect(() => {
    if (!needsLocationEnrichment || !initialQuery) {
      return;
    }

    let cancelled = false;
    const sourceQuery = initialQuery;

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
      const query = sourceQuery.includes("Starting from")
        ? sourceQuery
        : `${sourceQuery}${startingNote}`;

      if (!cancelled) {
        setEnrichedQuery({ source: sourceQuery, query });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [needsLocationEnrichment, initialQuery, trip.id, trip.preferences]);

  const chatInitialQuery =
    !isOwner || !initialQuery
      ? null
      : needsLocationEnrichment
        ? enrichedQuery?.source === initialQuery
          ? enrichedQuery.query
          : null
        : initialQuery;

  const refreshItinerary = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchMeta = async () => {
        const res = await fetch(`/api/trips/${trip.id}?view=meta`);
        return res.ok ? res.json() : null;
      };

      const meta = await fetchMeta();
      const itineraryDays = await fetchItineraryDays(trip.id);

      if (!meta) return;

      setTrip((prev) => ({
        ...prev,
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
    setDetailItemId(itemId);
    setLeftView("itinerary");
    setTimeout(() => {
      document
        .getElementById(`item-${itemId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  const detailItem =
    detailItemId != null
      ? (days.flatMap((d) => d.items).find((i) => i.id === detailItemId) ??
        null)
      : null;

  const chatPanel = (
    <ChatPanel
      tripId={trip.id}
      trip={{ destination: trip.destination, preferences: trip.preferences }}
      initialQuery={chatInitialQuery}
      initialMessages={filteredMessages}
      initialFollowUpPrompts={initialFollowUpPrompts}
      hasItinerary={days.length > 0}
      onItineraryUpdate={isOwner ? refreshItinerary : undefined}
      readOnly={!isOwner}
      {...(isDesktop
        ? {
            onMapClick: () => setRightView("map"),
            onCalendarClick: () => setRightView("calendar"),
            activeRightView: rightView,
          }
        : {})}
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

  const bookingsPanel = <BookingsPanel tripId={trip.id} readOnly={!isOwner} />;

  const itineraryPanel = (
    <div className="relative min-h-full">
      {refreshing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <LoadingState label="Updating itinerary…" />
        </div>
      )}
      {days.length > 1 && (
        <div className="sticky top-0 z-20 flex gap-1.5 overflow-x-auto border-b border-neutral-100 bg-white px-4 py-3">
          {days.map((day) => {
            const dayDate = getDayDate(trip.startDate, day.dayNumber);

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  setSelectedDay(day.dayNumber);
                  setMapShowAllPlaces(false);
                }}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  selectedDay === day.dayNumber
                    ? "bg-neutral-900 text-white shadow-sm shadow-neutral-200"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                Day {day.dayNumber}
                {dayDate && (
                  <span
                    className={cn(
                      "ml-1 font-medium",
                      selectedDay === day.dayNumber
                        ? "text-neutral-300"
                        : "text-neutral-400",
                    )}
                  >
                    · {format(dayDate, "MMM d")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <DayTimeline
        tripId={trip.id}
        days={days}
        tripStartDate={trip.startDate}
        onUpdate={isOwner ? refreshItinerary : undefined}
        onSelectItem={handleSelectItem}
        selectedDay={selectedDay}
        readOnly={!isOwner}
        budgetPerPerson={trip.preferences?.budgetPerPerson}
        budgetCurrency={
          trip.preferences?.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY
        }
        destination={trip.destination}
      />
    </div>
  );

  return (
    <AppShell fullHeight className="overflow-hidden bg-background">
      <ItemDetailDialog
        item={detailItem}
        destination={trip.destination}
        open={detailItemId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailItemId(null);
            setSelectedItemId(null);
          }
        }}
      />

      {!isOwner && (
        <div className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 md:px-6">
          You&apos;re viewing a shared trip. Only the owner can make changes.
        </div>
      )}

      {/* Trip header bar */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <TripTitleEditor
              tripId={trip.id}
              title={trip.title}
              readOnly={!isOwner}
              onTitleChange={(title) => setTrip((prev) => ({ ...prev, title }))}
            />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-foreground" />
                {trip.destination}
              </span>
              {trip.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-teal-500" />
                  {format(new Date(trip.startDate), "MMM d")}
                  {trip.endDate &&
                    ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
                </span>
              )}
            </div>
          </div>
          <TripExportMenu
            tripId={trip.id}
            tripTitle={trip.title}
            destination={trip.destination}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            days={days}
            budgetPerPerson={trip.preferences?.budgetPerPerson}
            budgetCurrency={
              trip.preferences?.budgetCurrency ?? DEFAULT_BUDGET_CURRENCY
            }
          />
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
                {(["chat", "itinerary", "ideas", "bookings"] as const).map(
                  (view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setLeftView(view)}
                      className={cn(
                        "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        leftView === view
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700",
                      )}
                    >
                      {view === "chat" && "Chat"}
                      {view === "itinerary" && "Itinerary"}
                      {view === "ideas" && "Ideas"}
                      {view === "bookings" && (
                        <span className="flex items-center justify-center gap-1">
                          Bookings
                        </span>
                      )}
                    </button>
                  ),
                )}
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
                ref={itineraryScrollRef}
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
              <div
                className={cn(
                  "absolute inset-0 flex flex-col overflow-hidden",
                  leftView !== "bookings" && "pointer-events-none invisible",
                )}
              >
                {bookingsPanel}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
            <div
              className={cn(
                "absolute inset-0",
                rightView !== "map" && "pointer-events-none invisible",
              )}
            >
              <TripMap
                days={days}
                destination={trip.destination}
                selectedDay={selectedDay}
                showAllPlaces={mapShowAllPlaces}
                onShowAllPlaces={() => setMapShowAllPlaces(true)}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
              />
            </div>
            <div
              className={cn(
                "absolute inset-0 flex flex-col overflow-hidden",
                rightView !== "calendar" && "pointer-events-none invisible",
              )}
            >
              <TripCalendar
                days={days}
                tripStartDate={trip.startDate}
                embedded
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs
            defaultValue={isOwner ? "chat" : "itinerary"}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TabsContent
                value="chat"
                className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden data-[state=active]:flex-col"
              >
                {chatPanel}
              </TabsContent>
              <TabsContent
                ref={itineraryScrollRef}
                value="itinerary"
                className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden"
              >
                {itineraryPanel}
              </TabsContent>
              <TabsContent
                value="ideas"
                className="mt-0 min-h-0 flex-1 overflow-auto data-[state=inactive]:hidden"
              >
                {ideasPanel}
              </TabsContent>
              <TabsContent
                value="bookings"
                className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden data-[state=active]:flex-col"
              >
                {bookingsPanel}
              </TabsContent>
              <TabsContent
                value="calendar"
                className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
              >
                <TripCalendar days={days} tripStartDate={trip.startDate} />
              </TabsContent>
              <TabsContent
                value="map"
                className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
              >
                <TripMap
                  days={days}
                  destination={trip.destination}
                  selectedDay={selectedDay}
                  showAllPlaces={mapShowAllPlaces}
                  onShowAllPlaces={() => setMapShowAllPlaces(true)}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                />
              </TabsContent>
            </div>

            <div className="shrink-0 border-t border-border bg-card px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <TabsList className="grid h-auto w-full grid-cols-6 gap-0.5 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="chat"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="itinerary"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <Route className="h-4 w-4" />
                  Itinerary
                </TabsTrigger>
                <TabsTrigger
                  value="ideas"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <Lightbulb className="h-4 w-4" />
                  Ideas
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <Plane className="h-4 w-4" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <CalendarDays className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  className="flex flex-col gap-0.5 rounded-lg px-0 py-1.5 text-[10px] leading-tight data-[state=active]:bg-neutral-100 data-[state=active]:shadow-none"
                >
                  <MapPin className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
