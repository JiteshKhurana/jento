"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-neutral-900",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "absolute left-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          "absolute right-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-neutral-500 rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected])]:bg-neutral-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-100",
        ),
        range_start:
          "day-range-start [&_.rdp-day_button]:bg-neutral-900 [&_.rdp-day_button]:text-white [&_.rdp-day_button]:hover:bg-neutral-900 [&_.rdp-day_button]:hover:text-white",
        range_end:
          "day-range-end [&_.rdp-day_button]:bg-neutral-900 [&_.rdp-day_button]:text-white [&_.rdp-day_button]:hover:bg-neutral-900 [&_.rdp-day_button]:hover:text-white",
        selected:
          "bg-neutral-900 text-white hover:bg-neutral-900 hover:text-white focus:bg-neutral-900 focus:text-white rounded-md [&_.rdp-day_button]:bg-neutral-900 [&_.rdp-day_button]:text-white",
        today: "bg-neutral-100 text-neutral-900",
        outside:
          "day-outside text-neutral-400 opacity-50 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-400",
        disabled: "text-neutral-400 opacity-50",
        range_middle: "aria-selected:bg-neutral-100 aria-selected:text-neutral-900",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar, type DateRange };
