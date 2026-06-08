import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-neutral-100 text-neutral-700",
        variant === "success" && "bg-blue-50 text-blue-700",
        variant === "secondary" && "bg-neutral-50 text-neutral-500 ring-1 ring-neutral-200/80",
        variant === "outline" && "border border-neutral-200 bg-white text-neutral-600",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
