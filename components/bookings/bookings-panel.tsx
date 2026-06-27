"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Plane,
  Hotel,
  Car,
  Train,
  Ticket,
  Shield,
  Globe,
  Tag,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeIllustration } from "@/components/ui/theme-illustration";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// ─── Upload Dialog ────────────────────────────────────────────────────────────

type UploadDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  category: BookingCategory;
  onCategoryChange: (category: BookingCategory) => void;
  onUpload: () => void;
  uploading: boolean;
  error: string | null;
};

function UploadDocumentDialog({
  open,
  onOpenChange,
  file,
  category,
  onCategoryChange,
  onUpload,
  uploading,
  error,
}: UploadDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 rounded-3xl p-6 sm:max-w-sm">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold">
            Upload document
          </DialogTitle>
          {file && (
            <DialogDescription className="truncate text-neutral-500">
              {file.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <p className="mt-5 text-sm font-medium text-neutral-700">Category</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CATEGORIES.map(([value, meta]) => (
            <button
              key={value}
              type="button"
              onClick={() => onCategoryChange(value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                category === value
                  ? "border-neutral-900 bg-neutral-50 font-medium text-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
              )}
            >
              {meta.icon}
              {meta.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 cursor-pointer rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 flex-1 cursor-pointer rounded-full"
            onClick={onUpload}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

export function BookingsPanel({
  tripId,
  readOnly = false,
}: BookingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bookings, setBookings] = useState<TripBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<BookingCategory>("OTHER");
  const [filterCategory, setFilterCategory] = useState<BookingCategory | "ALL">(
    "ALL",
  );

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

  function handleCategoryDialogOpenChange(open: boolean) {
    if (!open && uploading) return;
    setCategoryDialogOpen(open);
    if (!open) {
      setPendingFile(null);
      setSelectedCategory("OTHER");
      setUploadError(null);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setPendingFile(file);
    setSelectedCategory("OTHER");
    setCategoryDialogOpen(true);
  }

  async function handleUpload() {
    if (!pendingFile) return;

    setUploadError(null);
    setUploading(true);

    const title = pendingFile.name.replace(/\.[^/.]+$/, "");

    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("title", title);
      fd.append("category", selectedCategory);

      const res = await fetch(`/api/trips/${tripId}/bookings/upload`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed. Please try again.");
        return;
      }

      if (typeof pendo !== "undefined") {
        pendo.track("booking_uploaded", {
          tripId,
          bookingCategory: selectedCategory,
          fileType: pendingFile.type || "unknown",
          fileSizeBytes: pendingFile.size,
          title,
          hasNotes: false,
        });
      }

      handleUploaded(data as TripBookingData);
      setCategoryDialogOpen(false);
      setPendingFile(null);
      setSelectedCategory("OTHER");
    } catch {
      setUploadError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const uploadButton = (className?: string) =>
    !readOnly ? (
      <Button
        size={className ? "default" : "sm"}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn("cursor-pointer gap-1.5", className)}
      >
        {uploading ? (
          <Loader2
            className={cn(
              "animate-spin",
              className ? "h-4 w-4" : "h-3.5 w-3.5",
            )}
          />
        ) : (
          <Plus className={className ? "h-4 w-4" : "h-3.5 w-3.5"} />
        )}
        {uploading ? "Uploading…" : "Upload document"}
      </Button>
    ) : null;

  const filteredBookings =
    filterCategory === "ALL"
      ? bookings
      : bookings.filter((b) => b.category === filterCategory);

  // Build the category filter options based on what exists
  const presentCategories = Array.from(
    new Set(bookings.map((b) => b.category)),
  );

  const uploadDialog = (
    <UploadDocumentDialog
      open={categoryDialogOpen}
      onOpenChange={handleCategoryDialogOpenChange}
      file={pendingFile}
      category={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onUpload={handleUpload}
      uploading={uploading}
      error={uploadError}
    />
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={handleFileSelected}
    />
  );

  if (!loading && bookings.length === 0) {
    return (
      <>
        {fileInput}
        {uploadDialog}

        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
          <ThemeIllustration variant="documents" className="mb-6" />

          <h2 className="text-lg font-bold text-neutral-900">
            Upload flights, hotels, and travel documents.
          </h2>

          {uploadButton("mt-8")}
        </div>
      </>
    );
  }

  return (
    <>
      {fileInput}
      {uploadDialog}

      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <h2 className="text-lg font-bold text-neutral-900">Documents</h2>
          {uploadButton()}
        </div>

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
            <p className="text-sm font-medium text-neutral-700">
              No bookings in this category
            </p>
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
    </>
  );
}
