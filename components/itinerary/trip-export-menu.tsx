"use client";

import { useState } from "react";
import {
  CalendarPlus,
  Check,
  FileText,
  MoreVertical,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { buildItineraryIcs } from "@/lib/itinerary/export-ics";
import { buildItineraryPdf } from "@/lib/itinerary/export-pdf";
import { downloadBlob, slugifyFilename } from "@/lib/itinerary/download";

type TripExportMenuProps = {
  tripId: string;
  tripTitle: string;
  destination: string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  days: ItineraryDayData[];
  budgetPerPerson?: number | null;
  budgetCurrency?: string;
};

export function TripExportMenu({
  tripId,
  tripTitle,
  destination,
  tripStartDate,
  tripEndDate,
  days,
  budgetPerPerson,
  budgetCurrency,
}: TripExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "ics" | null>(null);
  const [shared, setShared] = useState(false);

  const hasItems = days.some((day) => day.items.length > 0);

  async function handleShare() {
    const url = `${window.location.origin}/trips/${tripId}`;
    let shareMethod = "clipboard";

    try {
      if (navigator.share) {
        await navigator.share({ title: tripTitle, url });
        shareMethod = "native_share";
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
    if (typeof pendo !== "undefined") {
      pendo.track("trip_shared", {
        tripId,
        tripTitle,
        shareMethod,
      });
    }
    setOpen(false);
  }

  async function handleDownloadPdf() {
    setExporting("pdf");
    try {
      const bytes = await buildItineraryPdf({
        tripTitle,
        destination,
        tripStartDate,
        tripEndDate,
        days,
        budgetPerPerson,
        budgetCurrency,
      });
      downloadBlob(
        new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }),
        `${slugifyFilename(tripTitle)}-itinerary.pdf`,
      );
      if (typeof pendo !== "undefined") {
        pendo.track("itinerary_exported_pdf", {
          tripId,
          tripTitle,
          destination,
          dayCount: days.length,
          itemCount: days.reduce((sum, d) => sum + d.items.length, 0),
        });
      }
      setOpen(false);
    } finally {
      setExporting(null);
    }
  }

  function handleDownloadIcs() {
    setExporting("ics");
    try {
      const ics = buildItineraryIcs({
        tripTitle,
        tripId,
        destination,
        tripStartDate,
        days,
      });
      downloadBlob(
        new Blob([ics], { type: "text/calendar;charset=utf-8" }),
        `${slugifyFilename(tripTitle)}-calendar.ics`,
      );
      if (typeof pendo !== "undefined") {
        pendo.track("itinerary_exported_calendar", {
          tripId,
          tripTitle,
          destination,
          dayCount: days.length,
        });
      }
      setOpen(false);
    } finally {
      setExporting(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Trip options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2 sm:w-52 sm:p-1">
        <button
          type="button"
          onClick={handleShare}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base text-neutral-700 transition-colors hover:bg-neutral-100 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          {shared ? (
            <Check className="h-5 w-5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" />
          ) : (
            <Share2 className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
          )}
          {shared ? "Link copied" : "Share trip link"}
        </button>
        <button
          type="button"
          disabled={!hasItems || exporting !== null}
          onClick={handleDownloadPdf}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          <FileText className="h-5 w-5 shrink-0 text-neutral-700 sm:h-4 sm:w-4" />
          {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          disabled={!hasItems || exporting !== null}
          onClick={handleDownloadIcs}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-base text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          <CalendarPlus className="h-5 w-5 shrink-0 text-teal-600 sm:h-4 sm:w-4" />
          {exporting === "ics" ? "Preparing calendar…" : "Export to Calendar"}
        </button>
      </PopoverContent>
    </Popover>
  );
}
