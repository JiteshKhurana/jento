"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Plane,
  Hotel,
  Car,
  Train,
  Ticket,
  Shield,
  Globe,
  Tag,
  Upload,
  Trash2,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeIllustration } from "@/components/ui/theme-illustration";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────────────────────────

type BookingCategory =
  | "FLIGHT"
  | "HOTEL"
  | "CAR_RENTAL"
  | "TRAIN"
  | "ACTIVITY"
  | "INSURANCE"
  | "VISA"
  | "OTHER";

export type TripBookingData = {
  id: string;
  title: string;
  category: BookingCategory;
  cloudinaryId: string;
  cloudinaryUrl: string;
  resourceType: string;
  fileFormat: string | null;
  fileSizeBytes: number | null;
  notes: string | null;
  createdAt: string;
};

type BookingsPanelProps = {
  tripId: string;
  readOnly?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  BookingCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  FLIGHT: {
    label: "Flight",
    icon: <Plane className="h-3.5 w-3.5" />,
    color: "bg-sky-50 text-sky-700",
  },
  HOTEL: {
    label: "Hotel",
    icon: <Hotel className="h-3.5 w-3.5" />,
    color: "bg-amber-50 text-amber-700",
  },
  CAR_RENTAL: {
    label: "Car Rental",
    icon: <Car className="h-3.5 w-3.5" />,
    color: "bg-orange-50 text-orange-700",
  },
  TRAIN: {
    label: "Train",
    icon: <Train className="h-3.5 w-3.5" />,
    color: "bg-purple-50 text-purple-700",
  },
  ACTIVITY: {
    label: "Activity",
    icon: <Ticket className="h-3.5 w-3.5" />,
    color: "bg-green-50 text-green-700",
  },
  INSURANCE: {
    label: "Insurance",
    icon: <Shield className="h-3.5 w-3.5" />,
    color: "bg-teal-50 text-teal-700",
  },
  VISA: {
    label: "Visa",
    icon: <Globe className="h-3.5 w-3.5" />,
    color: "bg-indigo-50 text-indigo-700",
  },
  OTHER: {
    label: "Other",
    icon: <Tag className="h-3.5 w-3.5" />,
    color: "bg-neutral-100 text-neutral-600",
  },
};

const CATEGORIES = Object.entries(CATEGORY_META) as [
  BookingCategory,
  (typeof CATEGORY_META)[BookingCategory],
][];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

type UploadZoneProps = {
  tripId: string;
  onUploaded: (booking: TripBookingData) => void;
};

function UploadZone({ tripId, onUploaded }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    file: File | null;
    title: string;
    category: BookingCategory;
    notes: string;
  }>({ file: null, title: "", category: "OTHER", notes: "" });

  function pickFile(file: File) {
    setError(null);
    setForm((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
    e.target.value = "";
  }

  async function handleUpload() {
    if (!form.file) return;
    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", form.file);
      fd.append("title", form.title.trim() || form.file.name.replace(/\.[^/.]+$/, ""));
      fd.append("category", form.category);
      if (form.notes.trim()) fd.append("notes", form.notes.trim());

      const res = await fetch(`/api/trips/${tripId}/bookings/upload`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      if (typeof pendo !== "undefined") {
        pendo.track("booking_uploaded", {
          tripId,
          bookingCategory: form.category,
          fileType: form.file.type || "unknown",
          fileSizeBytes: form.file.size,
          title: form.title.trim() || form.file.name,
          hasNotes: !!form.notes.trim(),
        });
      }
      onUploaded(data as TripBookingData);
      setForm({ file: null, title: "", category: "OTHER", notes: "" });
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-b border-neutral-100 bg-white px-4 pb-4 pt-3">
      {/* Drop target */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !form.file && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all",
          dragging
            ? "border-neutral-400 bg-neutral-50"
            : form.file
              ? "cursor-default border-neutral-200 bg-neutral-50"
              : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60",
        )}
      >
        {!form.file ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Upload className="h-5 w-5 text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-neutral-700">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-neutral-400">
              PDF, JPG, PNG, WebP — up to 20 MB
            </p>
          </>
        ) : (
          <div className="flex w-full items-center gap-3 px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              {form.file.type.startsWith("image/") ? (
                <ImageIcon className="h-5 w-5 text-neutral-500" />
              ) : (
                <FileText className="h-5 w-5 text-neutral-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">
                {form.file.name}
              </p>
              <p className="text-xs text-neutral-400">
                {formatBytes(form.file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setForm((prev) => ({ ...prev, file: null, title: "" }));
              }}
              className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
      />

      {form.file && (
        <div className="mt-3 space-y-2.5">
          {/* Title */}
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Document title"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-0"
          />

          {/* Category */}
          <Select
            value={form.category}
            onValueChange={(value) =>
              setForm((p) => ({
                ...p,
                category: value as BookingCategory,
              }))
            }
          >
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(([value, { label, icon }]) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    {icon}
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
            size="sm"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Save Booking
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

type BookingCardProps = {
  booking: TripBookingData;
  onDelete: (id: string) => void;
  readOnly: boolean;
};

function BookingCard({ booking, onDelete, readOnly }: BookingCardProps) {
  const [deleting, setDeleting] = useState(false);
  const meta = CATEGORY_META[booking.category] ?? CATEGORY_META.OTHER;
  const isImage = booking.resourceType === "image";

  async function handleDelete() {
    setDeleting(true);
    onDelete(booking.id);
  }

  return (
    <div className="group relative flex gap-3 rounded-xl border border-neutral-100 bg-white p-3 transition-shadow hover:shadow-sm">
      {/* Thumbnail / icon */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={booking.cloudinaryUrl}
            alt={booking.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-6 w-6 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-neutral-800">
            {booking.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={booking.cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              title="Open"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {!readOnly && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                title="Delete"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              meta.color,
            )}
          >
            {meta.icon}
            {meta.label}
          </span>
          {booking.fileFormat && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase text-neutral-500">
              {booking.fileFormat}
            </span>
          )}
          {booking.fileSizeBytes && (
            <span className="text-[10px] text-neutral-400">
              {formatBytes(booking.fileSizeBytes)}
            </span>
          )}
        </div>

        {booking.notes && (
          <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
            {booking.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Bookings Panel ───────────────────────────────────────────────────────────

export function BookingsPanel({ tripId, readOnly = false }: BookingsPanelProps) {
  const [bookings, setBookings] = useState<TripBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<BookingCategory | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trips/${tripId}/bookings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  async function handleDelete(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (typeof pendo !== "undefined") {
      pendo.track("booking_deleted", {
        tripId,
        bookingId,
        bookingCategory: booking?.category ?? "unknown",
      });
    }
    // Optimistic removal
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    await fetch(`/api/trips/${tripId}/bookings/${bookingId}`, {
      method: "DELETE",
    });
  }

  function handleUploaded(booking: TripBookingData) {
    setBookings((prev) => [booking, ...prev]);
  }

  const filteredBookings =
    filterCategory === "ALL"
      ? bookings
      : bookings.filter((b) => b.category === filterCategory);

  // Build the category filter options based on what exists
  const presentCategories = Array.from(new Set(bookings.map((b) => b.category)));

  return (
    <div className="flex h-full flex-col">
      {/* Upload zone — only for owners */}
      {!readOnly && <UploadZone tripId={tripId} onUploaded={handleUploaded} />}

      {/* Category filter chips */}
      {bookings.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-neutral-100 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setFilterCategory("ALL")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all",
              filterCategory === "ALL"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            All ({bookings.length})
          </button>
          {presentCategories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = bookings.filter((b) => b.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all",
                  filterCategory === cat
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {meta.icon}
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse gap-3 rounded-xl border border-neutral-100 bg-white p-3"
              >
                <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/5 rounded bg-neutral-100" />
                  <div className="h-3 w-1/4 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            {bookings.length === 0 && (
              <ThemeIllustration variant="documents" className="mb-2" />
            )}
            <div>
              <p className="text-sm font-medium text-neutral-700">
                {bookings.length === 0
                  ? "No bookings yet"
                  : "No bookings in this category"}
              </p>
              {bookings.length === 0 && !readOnly && (
                <p className="mt-1 text-xs text-neutral-400">
                  Upload your confirmations, tickets, and travel docs above.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onDelete={handleDelete}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
