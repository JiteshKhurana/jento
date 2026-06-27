"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  bookingId: string;
  bookingTitle: string;
  bookingCategory?: string;
  onDeleted: () => void;
};

export function DeleteBookingDialog({
  open,
  onOpenChange,
  tripId,
  bookingId,
  bookingTitle,
  bookingCategory,
  onDeleted,
}: DeleteBookingDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (typeof pendo !== "undefined") {
          pendo.track("booking_deleted", {
            tripId,
            bookingId,
            bookingCategory: bookingCategory ?? "unknown",
          });
        }
        onOpenChange(false);
        onDeleted();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-w-sm gap-0 rounded-3xl p-8 sm:max-w-sm"
      >
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="text-xl font-semibold leading-snug">
            Delete &ldquo;{bookingTitle}&rdquo;?
          </DialogTitle>
          <DialogDescription className="text-left text-neutral-500">
            This will permanently remove the document.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-full cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 flex-1 rounded-full cursor-pointer"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner size="sm" className="text-white" />
                Deleting…
              </>
            ) : (
              "Yes, delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
