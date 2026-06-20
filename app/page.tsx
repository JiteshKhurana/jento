import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { LandingHeader } from "@/components/home/landing-header";
import { LandingHero } from "@/components/home/landing-hero";
import { LandingCuratedSection } from "@/components/home/landing-curated-section";
import { LandingJustAskSection } from "@/components/home/landing-just-ask-section";
import { LandingPersonalTouchSection } from "@/components/home/landing-personal-touch-section";
import { LandingItinerarySteps } from "@/components/home/landing-itinerary-steps";
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
      <LandingHeader userId={userId ?? null} />

      <main className="flex flex-1 flex-col">
        <LandingHero userId={userId ?? null} />
        <LandingItinerarySteps />
        <LandingCuratedSection />
        <LandingJustAskSection />
        <LandingPersonalTouchSection />
        <LandingPageSections
          userId={userId ?? null}
          previewPhotos={previewPhotos}
          previewDestinations={previewDestinations}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-background py-10 text-sm text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logoblack.svg"
              alt=""
              width={18}
              height={32}
              className="h-8 w-[18px] dark:hidden"
            />
            <Image
              src="/logowhite.svg"
              alt=""
              width={18}
              height={32}
              className="hidden h-8 w-[18px] dark:block"
            />
            <span className="font-jento text-[28px] leading-none text-black dark:text-white">
              JENTO
            </span>
          </Link>
          <p>
            © {new Date().getFullYear()} Jento. Less planning. More exploring.
          </p>
        </div>
      </footer>
    </div>
  );
}
