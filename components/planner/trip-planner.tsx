"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  Lightbulb,
  MapPin,
  MessageSquare,
  Plane,
  Route,
} from "lucide-react";
import { AppShell, useMobileSidebar } from "@/components/layout/app-shell";
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
  const [itineraryHasUpdate, setItineraryHasUpdate] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<string>(
    isOwner ? "chat" : "itinerary",
  );
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tabSwitchTimeRef = useRef(0);
  const isDesktop = useIsDesktop();
  const mobileSidebarOpen = useMobileSidebar();
  const itineraryScrollRef = useRef<HTMLDivElement>(null);
  const leftViewRef = useRef(leftView);
  const mobileActiveTabRef = useRef(mobileActiveTab);
  const isDesktopRef = useRef(isDesktop);
  const itineraryDaysRef = useRef(trip.itineraries[0]?.days ?? []);

  useEffect(() => {
    leftViewRef.current = leftView;
  }, [leftView]);

  useEffect(() => {
    mobileActiveTabRef.current = mobileActiveTab;
  }, [mobileActiveTab]);

  useEffect(() => {
    isDesktopRef.current = isDesktop;
  }, [isDesktop]);

  useEffect(() => {
    itineraryDaysRef.current = trip.itineraries[0]?.days ?? [];
  }, [trip.itineraries]);

  useEffect(() => {
    itineraryScrollRef.current?.scrollTo({ top: 0 });
  }, [selectedDay]);

  const handleLeftViewChange = useCallback(
    (view: "chat" | "itinerary" | "ideas" | "bookings") => {
      setLeftView(view);
      if (view === "itinerary") {
        setItineraryHasUpdate(false);
      }
    },
    [],
  );

  const handleMobileTabChange = useCallback((tab: string) => {
    setMobileActiveTab(tab);
    setTabBarVisible(true);
    lastScrollYRef.current = 0;
    tabSwitchTimeRef.current = Date.now();
    if (tab === "itinerary") {
      setItineraryHasUpdate(false);
    }
  }, []);

  const handleGoToChat = useCallback(() => {
    if (isDesktopRef.current) {
      handleLeftViewChange("chat");
    } else {
      handleMobileTabChange("chat");
    }
  }, [handleLeftViewChange, handleMobileTabChange]);

  function handleContentScroll(e: React.UIEvent<HTMLElement>) {
    // Ignore scroll events fired in the first 250ms after a tab switch; the
    // browser sometimes fires a scroll event when restoring a previously-
    // scrolled tab, which would instantly hide the bar.
    if (Date.now() - tabSwitchTimeRef.current < 250) return;

    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    const delta = scrollTop - lastScrollYRef.current;

    if (scrollTop <= 0) {
      setTabBarVisible(true);
    } else if (delta > 20) {
      setTabBarVisible(false);
    } else if (delta < -10) {
      setTabBarVisible(true);
    }

    lastScrollYRef.current = scrollTop;
  }

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

      const previousSnapshot = JSON.stringify(itineraryDaysRef.current);
      const itineraryChanged =
        JSON.stringify(itineraryDays) !== previousSnapshot;

      if (itineraryChanged) {
        const onItineraryTab = isDesktopRef.current
          ? leftViewRef.current === "itinerary"
          : mobileActiveTabRef.current === "itinerary";
        if (!onItineraryTab) {
          setItineraryHasUpdate(true);
        }
      }

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
    handleLeftViewChange("itinerary");
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
      {...(isDesktop === false
        ? {
            floatingInput: true,
            scrollContainerClassName: "pb-52",
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
        onChatClick={isOwner ? handleGoToChat : undefined}
      />
    </div>
  );

  const mobileHeaderActions = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleMobileTabChange("calendar")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all",
          mobileActiveTab === "calendar"
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        Calendar
      </button>
      <button
        type="button"
        onClick={() => handleMobileTabChange("map")}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all",
          mobileActiveTab === "map"
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
        Map
      </button>
    </div>
  );

  return (
    <AppShell
      fullHeight
      className="overflow-hidden bg-background"
      mobileHeaderActions={mobileHeaderActions}
    >
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
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-x-2 md:gap-x-3">
            <Link
              href="/trips"
              aria-label="Back to My trips"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full md:hidden",
                "bg-neutral-100/90 text-neutral-600 shadow-sm backdrop-blur-sm",
                "transition-all duration-200 active:scale-95",
                "hover:bg-neutral-200/90 hover:text-neutral-900",
                "dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white",
              )}
            >
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </Link>
            <div className="min-w-0">
              <TripTitleEditor
                tripId={trip.id}
                title={trip.title}
                readOnly={!isOwner}
                onTitleChange={(title) =>
                  setTrip((prev) => ({ ...prev, title }))
                }
              />
            </div>
            {trip.startDate && (
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-teal-500" />
                {format(new Date(trip.startDate), "MMM d")}
                {trip.endDate &&
                  ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
              </span>
            )}
            <span className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground md:flex">
              <MapPin className="h-3.5 w-3.5 text-foreground" />
              {trip.destination}
            </span>
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
                      onClick={() => handleLeftViewChange(view)}
                      aria-label={
                        view === "itinerary" && itineraryHasUpdate
                          ? "Itinerary, updated"
                          : undefined
                      }
                      className={cn(
                        "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        leftView === view
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700",
                      )}
                    >
                      {view === "chat" && "Chat"}
                      {view === "itinerary" && (
                        <span className="relative inline-flex items-center">
                          Itinerary
                          {itineraryHasUpdate && (
                            <span
                              className="absolute -right-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-full rounded-full bg-teal-500"
                              aria-hidden
                            />
                          )}
                        </span>
                      )}
                      {view === "ideas" && "Ideas"}
                      {view === "bookings" && (
                        <span className="flex items-center justify-center gap-1">
                          Documents
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

          <div className="flex min-h-0 flex-col overflow-hidden bg-white">
            <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-3">
              <div className="flex rounded-xl bg-neutral-100 p-1">
                {(["map", "calendar"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRightView(v)}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      rightView === v
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700",
                    )}
                  >
                    {v === "map" ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Map
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Calendar
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
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
                  onChatClick={isOwner ? handleGoToChat : undefined}
                  readOnly={!isOwner}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs
            value={mobileActiveTab}
            onValueChange={handleMobileTabChange}
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
                onScroll={handleContentScroll}
                className="mt-0 min-h-0 flex-1 overflow-auto pb-28 data-[state=inactive]:hidden"
              >
                {itineraryPanel}
              </TabsContent>
              <TabsContent
                value="ideas"
                onScroll={handleContentScroll}
                className="mt-0 min-h-0 flex-1 overflow-auto pb-28 data-[state=inactive]:hidden"
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
                <TripCalendar
                  days={days}
                  tripStartDate={trip.startDate}
                  onChatClick={isOwner ? handleGoToChat : undefined}
                  readOnly={!isOwner}
                />
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

            {/* Floating bottom tab bar */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-30 px-5 transition-[transform,opacity] duration-300 ease-in-out md:hidden",
                "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
                tabBarVisible && !mobileSidebarOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0 pointer-events-none",
              )}
            >
              <TabsList className="grid h-auto w-full grid-cols-4 rounded-full border border-neutral-100 bg-white p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.13),0_1px_4px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-900">
                <TabsTrigger
                  value="chat"
                  className="flex flex-col gap-1 rounded-full px-0 py-2 text-[10px] font-medium leading-tight transition-colors data-[state=active]:bg-neutral-200/80 data-[state=active]:font-semibold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none data-[state=inactive]:text-neutral-400 dark:data-[state=inactive]:text-white"
                >
                  <MessageSquare className="h-6 w-6" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="itinerary"
                  aria-label={
                    itineraryHasUpdate ? "Itinerary, updated" : "Itinerary"
                  }
                  className="flex flex-col gap-1 rounded-full px-0 py-2 text-[10px] font-medium leading-tight transition-colors data-[state=active]:bg-neutral-200/80 data-[state=active]:font-semibold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none data-[state=inactive]:text-neutral-400 dark:data-[state=inactive]:text-white"
                >
                  <span className="relative">
                    <Route className="h-6 w-6" />
                    {itineraryHasUpdate && (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-neutral-900"
                        aria-hidden
                      />
                    )}
                  </span>
                  Itinerary
                </TabsTrigger>
                <TabsTrigger
                  value="ideas"
                  className="flex flex-col gap-1 rounded-full px-0 py-2 text-[10px] font-medium leading-tight transition-colors data-[state=active]:bg-neutral-200/80 data-[state=active]:font-semibold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none data-[state=inactive]:text-neutral-400 dark:data-[state=inactive]:text-white"
                >
                  <Lightbulb className="h-6 w-6" />
                  Ideas
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="flex flex-col gap-1 rounded-full px-0 py-2 text-[10px] font-medium leading-tight transition-colors data-[state=active]:bg-neutral-200/80 data-[state=active]:font-semibold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none data-[state=inactive]:text-neutral-400 dark:data-[state=inactive]:text-white"
                >
                  <Plane className="h-6 w-6" />
                  Documents
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
