"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteTripDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripTitle: string;
};

export function DeleteTripDialog({
  open,
  onOpenChange,
  tripId,
  tripTitle,
}: DeleteTripDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (res.ok) {
        onOpenChange(false);
        router.refresh();
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
            Delete &ldquo;{tripTitle}&rdquo;?
          </DialogTitle>
          <DialogDescription className="text-left text-neutral-500">
            This will also delete its associated chats.
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
            className="h-11 flex-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
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
