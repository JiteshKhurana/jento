"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/trips", label: "My trips" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 md:px-6">
      <Link
        href="/trips"
        className="text-lg font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-70"
      >
        AITravel
      </Link>
      <div className="flex items-center gap-4">
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "font-medium text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {link.label}
            </Link>
          ))}
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
