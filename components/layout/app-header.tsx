import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="glass sticky top-0 z-50 flex h-14 items-center justify-between border-b border-neutral-200/80 px-4 md:px-6">
      <Link
        href="/trips"
        className="text-lg font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-70"
      >
        AITravel
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/trips"
          className="hidden text-sm text-neutral-500 transition-colors hover:text-neutral-900 sm:block"
        >
          My trips
        </Link>
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
