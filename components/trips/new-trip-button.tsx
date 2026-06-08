"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewTripDialog } from "@/components/trips/new-trip-dialog";
import { Button } from "@/components/ui/button";

type NewTripButtonProps = {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  className?: string;
  showIcon?: boolean;
};

export function NewTripButton({
  label = "New trip",
  size = "default",
  variant = "default",
  className,
  showIcon = true,
}: NewTripButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        {showIcon && <Plus className="h-4 w-4" />}
        {label}
      </Button>
      <NewTripDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
