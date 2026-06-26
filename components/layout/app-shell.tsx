"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Heart, Menu, Moon, Sun, Map, Search, X } from "lucide-react";
import { SidebarInset } from "@/components/ui/sidebar";
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

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const navLinks =
    isLoaded && user ? [...baseNavLinks, savedNavLink] : baseNavLinks;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link
            href="/trips"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <Image
              src="/logoblack.svg"
              alt=""
              width={14}
              height={24}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/logowhite.svg"
              alt=""
              width={14}
              height={24}
              className="hidden h-6 w-auto dark:block"
            />
            <span className="font-jento text-lg leading-none text-black dark:text-white">
              JENTO
            </span>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme toggle + profile */}
        <div className="space-y-1 border-t border-border px-3 py-4">
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 shrink-0 dark:hidden" />
            <Moon className="hidden h-5 w-5 shrink-0 dark:block" />
            Toggle theme
          </button>
          {isLoaded && user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8 shrink-0" },
                }}
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {user.fullName ?? user.username ?? "User"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MobileHeader({
  mobileHeaderActions,
  onMenuClick,
}: {
  mobileHeaderActions?: React.ReactNode;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileHeaderActions && (
        <div className="flex items-center gap-2">{mobileHeaderActions}</div>
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
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <MobileHeader
          mobileHeaderActions={mobileHeaderActions}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {children}
      </SidebarInset>
    </MobileSidebarContext.Provider>
  );
}
