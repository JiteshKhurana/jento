import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHero } from "@/components/home/landing-hero";
import { LandingPageSections } from "@/components/home/landing-page-sections";
import { FEATURED_DESTINATIONS } from "@/lib/inspire/templates";
import { getUnsplashPhoto } from "@/lib/unsplash/photos";

export default async function HomePage() {
  const { userId } = await auth();

  const previewDestinations = FEATURED_DESTINATIONS.slice(0, 4);
  const previewPhotos = await Promise.all(
    previewDestinations.map((d) => getUnsplashPhoto(d.unsplashQuery)),
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200/60 px-6 py-4 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black tracking-tight text-neutral-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500">
            <Plane className="h-4 w-4 text-white" />
          </span>
          AITravel
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-neutral-900"
          >
            How it works
          </Link>
          <Link
            href="/inspire"
            className="transition-colors hover:text-neutral-900"
          >
            Inspiration
          </Link>
          {userId && (
            <Link
              href="/trips"
              className="transition-colors hover:text-neutral-900"
            >
              My trips
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {userId ? (
            <Button
              className="rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-700"
              asChild
            >
              <Link href="/trips">My trips</Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="rounded-full text-neutral-700 hover:text-neutral-900"
                asChild
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                className="rounded-full bg-orange-500 px-5 text-white shadow-md shadow-orange-200 hover:bg-orange-600"
                asChild
              >
                <Link href="/sign-up">Get started free</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <LandingHero
          userId={userId ?? null}
          previewPhotos={previewPhotos}
          previewDestinations={previewDestinations}
        />
        <LandingPageSections
          userId={userId ?? null}
          previewPhotos={previewPhotos}
          previewDestinations={previewDestinations}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-white py-10 text-sm text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-neutral-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500">
              <Plane className="h-3 w-3 text-white" />
            </span>
            AITravel
          </Link>
          <div className="flex gap-6 text-xs">
            <Link href="/inspire" className="hover:text-neutral-700">
              Inspiration
            </Link>
            <Link href="/explore" className="hover:text-neutral-700">
              Explore
            </Link>
            <Link
              href={userId ? "/trips" : "/sign-up"}
              className="hover:text-neutral-700"
            >
              {userId ? "My trips" : "Sign up"}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} AITravel. Plan smarter. Travel better.</p>
        </div>
      </footer>
    </div>
  );
}
