"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { NewTripDialog } from "@/components/trips/new-trip-dialog";

export default function NewTripPage() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      window.location.href = "/trips";
    }
  }, [open]);

  return (
    <AppShell className="bg-background">
      <NewTripDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
