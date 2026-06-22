"use client";

import { LandingTryOutSection } from "@/components/home/landing-try-out-section";
import { LandingQuizSection } from "@/components/home/landing-quiz-section";
import { LandingPlannedYourWaySection } from "@/components/home/landing-planned-your-way-section";

interface LandingPageSectionsProps {
  userId: string | null;
}

// ─── Composed export ──────────────────────────────────────────────────────────

export function LandingPageSections({ userId }: LandingPageSectionsProps) {
  return (
    <>
      <LandingTryOutSection userId={userId} />
      <LandingQuizSection />
      <LandingPlannedYourWaySection />
    </>
  );
}
