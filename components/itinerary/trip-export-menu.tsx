"use client";

import { useState } from "react";
import { CalendarPlus, Check, FileText, MoreVertical, Share2 } from "lucide-react";
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

    try {
      if (navigator.share) {
        await navigator.share({ title: tripTitle, url });
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
          className="h-8 w-8 shrink-0 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Trip options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <button
          type="button"
          onClick={handleShare}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {shared ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <Share2 className="h-4 w-4 shrink-0" />
          )}
          {shared ? "Link copied" : "Share trip link"}
        </button>
        <button
          type="button"
          disabled={!hasItems || exporting !== null}
          onClick={handleDownloadPdf}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
        >
          <FileText className="h-4 w-4 shrink-0 text-neutral-700" />
          {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          disabled={!hasItems || exporting !== null}
          onClick={handleDownloadIcs}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4 shrink-0 text-teal-600" />
          {exporting === "ics" ? "Preparing calendar…" : "Export to Calendar"}
        </button>
      </PopoverContent>
    </Popover>
  );
}
