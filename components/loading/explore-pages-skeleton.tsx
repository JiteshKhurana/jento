import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

function PlaceCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 pb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-4/3 w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ExploreLayoutSkeleton({ feed }: { feed: React.ReactNode }) {
  return (
    <AppShell fullHeight className="overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex min-h-0 flex-col md:w-[58%] md:border-r md:border-neutral-200/80">
            {feed}
          </div>
          <div className="relative hidden min-h-[50vh] flex-1 md:block md:min-h-0">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        </div>

        <div className="flex gap-2 border-t border-neutral-200/80 bg-white p-2 md:hidden">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}

export function ExplorePageSkeleton() {
  return (
    <ExploreLayoutSkeleton
      feed={
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-3 border-b border-neutral-100 px-4 py-4 md:px-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="ml-auto h-8 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            </div>
            <div className="flex gap-2 overflow-hidden pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <PlaceCardsSkeleton />
          </div>
        </div>
      }
    />
  );
}

export function SavedPageSkeleton() {
  return (
    <ExploreLayoutSkeleton
      feed={
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-neutral-100 px-4 py-4 md:px-6">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 md:px-6">
            <PlaceCardsSkeleton />
          </div>
        </div>
      }
    />
  );
}
