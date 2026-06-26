"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type ExploreSavedNavProps = {
  active: "explore" | "saved";
};

const tabClassName =
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none";

export function ExploreSavedNav({ active }: ExploreSavedNavProps) {
  return (
    <div className="hidden h-10 items-center justify-center rounded-full bg-secondary p-1 text-muted-foreground md:inline-flex">
      <Link
        href="/explore"
        className={cn(
          tabClassName,
          active === "explore" &&
            "bg-card text-foreground shadow-sm dark:bg-white dark:text-black",
        )}
      >
        Explore
      </Link>
      <Link
        href="/saved"
        className={cn(
          tabClassName,
          active === "saved" &&
            "bg-card text-foreground shadow-sm dark:bg-white dark:text-black",
        )}
      >
        Saved
      </Link>
    </div>
  );
}
