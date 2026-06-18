import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

interface LandingHeaderProps {
  userId: string | null;
}

const navLinks = [
  { href: "/trips", label: "My Trips" },
  { href: "/explore", label: "Explore" },
  { href: "/inspire", label: "Inspiration" },
] as const;

export function LandingHeader({ userId }: LandingHeaderProps) {
  return (
    <div className="sticky top-0 z-50 flex justify-center px-4 py-4 md:px-8 md:py-6">
      <header className="flex w-full max-w-6xl items-center justify-between gap-4 rounded-full bg-white px-5 py-2.5 shadow-[0_0_10px_rgba(0,0,0,0.15)] sm:px-8 md:px-12 lg:px-20">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/Group 3.svg"
            alt=""
            width={18}
            height={32}
            className="h-8 w-[18px]"
            priority
          />
          <span className="font-jento text-[28px] leading-none text-black">
            JENTO
          </span>
        </Link>

        <nav className="hidden items-center gap-6 rounded-full bg-neutral-100 px-4 py-2 text-base text-black/80 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:text-black"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ModeToggle />
          <Link
            href={userId ? "/trips" : "/sign-in"}
            className="rounded-full bg-black px-4 py-2 text-base font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {userId ? "My Trips" : "Sign in"}
          </Link>
        </div>
      </header>
    </div>
  );
}
