"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, GripVertical, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDurationHoursValue,
  fromTimeInputValue,
  isValidDurationHoursInput,
  parseDurationHoursValue,
  toTimeInputValue,
} from "@/lib/itinerary/time-utils";

type ItemEditorProps = {
  item: {
    id: string;
    title: string;
    description?: string | null;
    startTime?: string | null;
    duration?: string | null;
  };
  badgeClass?: string;
  badgeLabel?: string;
  onSave: (updates: Partial<ItemEditorProps["item"]>) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  readOnly?: boolean;
};

export function ItemEditor({
  item,
  badgeClass,
  badgeLabel,
  onSave,
  onDelete,
  onCancel,
  dragHandleProps,
  readOnly = false,
}: ItemEditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [startTimeInput, setStartTimeInput] = useState(() =>
    toTimeInputValue(item.startTime),
  );
  const [durationHours, setDurationHours] = useState(() =>
    parseDurationHoursValue(item.duration),
  );
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  function handleCancel() {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setStartTimeInput(toTimeInputValue(item.startTime));
    setDurationHours(parseDurationHoursValue(item.duration));
    onCancel?.();
  }

  async function handleSave() {
    setLoading(true);
    await onSave({
      title,
      description,
      startTime: fromTimeInputValue(startTimeInput),
      duration: formatDurationHoursValue(durationHours),
    });
    setLoading(false);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete();
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  const fieldClassName =
    "h-9 rounded-lg border-neutral-200 bg-white text-[15px] shadow-none focus-visible:ring-neutral-300/60";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-300/80 bg-white shadow-md ring-2 ring-neutral-900/5">
      {!readOnly && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
          {dragHandleProps && (
            <button
              type="button"
              className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/95 text-neutral-400 shadow-sm backdrop-blur-sm active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...dragHandleProps}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading || deleting}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/95 text-red-500 shadow-sm backdrop-blur-sm hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="p-4 pt-3">
        <div className="mb-4 flex flex-wrap items-center gap-2 pr-16">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
            Editing stop
          </span>
          {badgeLabel && badgeClass && (
            <span
              className={`tag-pill shrink-0 text-[11px] py-0 ${badgeClass}`}
            >
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label
              htmlFor={`item-title-${item.id}`}
              className="text-[13px] text-neutral-500"
            >
              Title
            </Label>
            <Input
              ref={titleRef}
              id={`item-title-${item.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Place or activity name"
              className={`${fieldClassName} font-medium`}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor={`item-start-${item.id}`}
                className="flex items-center gap-1 text-[13px] text-neutral-500"
              >
                <Clock className="h-3 w-3" />
                Start time
              </Label>
              <Input
                id={`item-start-${item.id}`}
                type="time"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor={`item-duration-${item.id}`}
                className="text-[13px] text-neutral-500"
              >
                Duration
              </Label>
              <div className="relative">
                <Input
                  id={`item-duration-${item.id}`}
                  value={durationHours}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (isValidDurationHoursInput(next)) {
                      setDurationHours(next);
                    }
                  }}
                  inputMode="decimal"
                  placeholder="2"
                  className={`${fieldClassName} pr-8`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[15px] text-neutral-400">
                  h
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor={`item-notes-${item.id}`}
              className="text-[13px] text-neutral-500"
            >
              Notes
            </Label>
            <Textarea
              id={`item-notes-${item.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add tips, reservations, or reminders…"
              rows={2}
              className="min-h-[72px] resize-none rounded-lg border-neutral-200 bg-white text-[15px] shadow-none focus-visible:ring-neutral-300/60"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/60 px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-neutral-600 cursor-pointer"
          onClick={handleCancel}
          disabled={loading || deleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 bg-neutral-900 px-4 text-white hover:bg-neutral-800 cursor-pointer"
          onClick={handleSave}
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="text-white" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          showClose={false}
          className="max-w-sm gap-0 rounded-3xl p-8 sm:max-w-sm"
        >
          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-xl font-semibold leading-snug">
              Remove &ldquo;{item.title}&rdquo;?
            </DialogTitle>
            <DialogDescription className="text-left text-neutral-500">
              This item will be removed from your itinerary.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-full cursor-pointer"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Removing…
                </>
              ) : (
                "Yes, remove"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
