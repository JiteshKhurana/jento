"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
};

const mobileNavLinks = [
  { href: "/trips", label: "My trips" },
  { href: "/explore", label: "Explore" },
] as const;

function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-stretch border-b border-border bg-mesh px-4 md:hidden">
      <div className="flex-1" />
      <div className="flex items-stretch gap-2">
        {mobileNavLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center px-3 text-lg font-semibold transition-colors",
                isActive ? "text-black" : "text-muted-foreground",
              )}
            >
              {link.label}
              {isActive ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-black"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-1 items-center justify-end">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}

export function AppShell({ children, className, fullHeight }: AppShellProps) {
  return (
    <SidebarInset
      className={cn(
        "flex flex-col",
        fullHeight ? "h-svh overflow-hidden" : "min-h-svh",
        className,
      )}
    >
      <MobileHeader />
      {children}
    </SidebarInset>
  );
}
