"use client";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
};

export function AppShell({ children, className, fullHeight }: AppShellProps) {
  return (
    <SidebarInset
      className={cn(
        "flex flex-col",
        fullHeight ? "h-svh overflow-hidden" : "min-h-svh",
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden">
        <SidebarTrigger className="-ml-1" />
        <span className="text-sm font-semibold text-foreground">
          Jento
        </span>
      </header>
      {children}
    </SidebarInset>
  );
}
