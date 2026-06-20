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
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "success" && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        variant === "secondary" && "bg-surface text-muted-foreground ring-1 ring-border",
        variant === "outline" && "border border-border bg-card text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
