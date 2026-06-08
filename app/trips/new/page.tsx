"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { NewTripDialog } from "@/components/trips/new-trip-dialog";

export default function NewTripPage() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      window.location.href = "/trips";
    }
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <AppHeader />
      <NewTripDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
