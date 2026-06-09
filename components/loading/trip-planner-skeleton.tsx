import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function TripPlannerSkeleton() {
  return (
    <AppShell fullHeight className="overflow-hidden bg-neutral-50">

      <div className="shrink-0 border-b border-neutral-200/80 bg-white px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-[minmax(380px,42%)_1fr]">
        <div className="flex min-h-0 flex-col border-r border-neutral-200/80 bg-white">
          <div className="flex shrink-0 border-b border-neutral-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mx-4 my-3 h-5 flex-1" />
            ))}
          </div>
          <div className="space-y-6 p-5">
            <div className="flex justify-end">
              <Skeleton className="h-10 w-3/5 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-2/5 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="mt-auto border-t border-neutral-100 p-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <Skeleton className="mx-4 mt-2 h-10 w-full rounded-full" />
        <div className="flex flex-1 flex-col p-4">
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
