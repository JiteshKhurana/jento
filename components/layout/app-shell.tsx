"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Map, Search, Settings, X } from "lucide-react";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createContext, useContext, useState } from "react";

const MobileSidebarContext = createContext(false);
export const useMobileSidebar = () => useContext(MobileSidebarContext);

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  mobileHeaderActions?: React.ReactNode;
};

const baseNavLinks = [
  { href: "/trips", label: "My trips", icon: Map },
  { href: "/explore", label: "Explore", icon: Search },
] as const;

const savedNavLink = {
  href: "/saved",
  label: "Saved",
  icon: Heart,
} as const;

const settingsNavLink = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
} as const;

function MobileHeader({
  mobileHeaderActions,
  open,
  onOpenChange,
}: {
  mobileHeaderActions?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const navLinks =
    isLoaded && user
      ? [...baseNavLinks, savedNavLink, settingsNavLink]
      : [...baseNavLinks, settingsNavLink];

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <div className="relative h-7 w-7">
                <Menu
                  className={cn(
                    "absolute inset-0 h-7 w-7 transition-all duration-200",
                    open
                      ? "rotate-90 scale-50 opacity-0"
                      : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 h-7 w-7 transition-all duration-200",
                    open
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-50 opacity-0",
                  )}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </PopoverContent>
        </Popover>
        <Link href="/trips" className="flex min-w-0 items-center gap-2">
          <Image
            src="/logoblack.svg"
            alt=""
            width={14}
            height={24}
            className="h-6 w-auto shrink-0 dark:hidden"
          />
          <Image
            src="/logowhite.svg"
            alt=""
            width={14}
            height={24}
            className="hidden h-6 w-auto shrink-0 dark:block"
          />
          <span className="font-jento truncate text-lg leading-none text-black dark:text-white">
            JENTO
          </span>
        </Link>
      </div>
      {mobileHeaderActions && (
        <div className="flex shrink-0 items-center gap-2">
          {mobileHeaderActions}
        </div>
      )}
    </header>
  );
}

export function AppShell({
  children,
  className,
  fullHeight,
  mobileHeaderActions,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MobileSidebarContext.Provider value={sidebarOpen}>
      <SidebarInset
        className={cn(
          "flex flex-col",
          fullHeight ? "h-svh overflow-hidden" : "min-h-svh",
          className,
        )}
      >
        <MobileHeader
          mobileHeaderActions={mobileHeaderActions}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        {children}
      </SidebarInset>
    </MobileSidebarContext.Provider>
  );
}
