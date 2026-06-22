import { auth } from "@clerk/nextjs/server";
import { LandingHeader } from "@/components/home/landing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LandingHero } from "@/components/home/landing-hero";
import { LandingCuratedSection } from "@/components/home/landing-curated-section";
import { LandingJustAskSection } from "@/components/home/landing-just-ask-section";
import { LandingPersonalTouchSection } from "@/components/home/landing-personal-touch-section";
import { LandingItinerarySteps } from "@/components/home/landing-itinerary-steps";
import { LandingPageSections } from "@/components/home/landing-page-sections";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader userId={userId ?? null} />

      <main className="flex flex-1 flex-col">
        <LandingHero userId={userId ?? null} />
        <LandingItinerarySteps />
        <LandingCuratedSection />
        <LandingJustAskSection />
        <LandingPersonalTouchSection />
        <LandingPageSections userId={userId ?? null} />
      </main>

      <SiteFooter />
    </div>
  );
}
