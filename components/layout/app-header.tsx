"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/inspire", label: "Inspire" },
  { href: "/explore", label: "Explore" },
  { href: "/trips", label: "My trips" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 md:px-6">
      <Link
        href="/trips"
        className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-75"
      >
        <Plane className="h-4 w-4 text-orange-500" />
        AITravel
      </Link>
      <div className="flex items-center gap-4">
        <nav className="hidden items-center gap-0.5 sm:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "font-semibold text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-orange-500" />
                )}
              </Link>
            );
          })}
        </nav>
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
