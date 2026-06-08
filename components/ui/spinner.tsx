import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-neutral-400", sizeClasses[size], className)}
      aria-hidden={!label}
      aria-label={label}
    />
  );
}

type LoadingStateProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function LoadingState({
  label = "Loading…",
  className,
  size = "md",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-sm text-neutral-400",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} />
      <span>{label}</span>
    </div>
  );
}
