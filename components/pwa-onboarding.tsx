"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

const ONBOARDING_SEEN_KEY = "pwa-onboarding-seen";

function subscribeStandalone(onStoreChange: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

const slides = [
  {
    image: "/illustrations/onboarding1.png",
    title: "Welcome to AI itinerary planner!",
    subtitle:
      "Plan a trip to any place without stressing about destinations and stops",
  },
  {
    image: "/illustrations/onboarding2.png",
    title: "Simple steps, perfect trip",
    subtitle:
      "Choose your destination, customize choices, add preferences — your itinerary is ready!",
  },
  {
    image: "/illustrations/onboarding3.png",
    title: "Stops, Food, Hotels.\nYou have it all figured.",
    subtitle:
      "Get a complete day-by-day itinerary with every detail planned for you",
  },
] as const;

export function PwaOnboarding() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const inStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    () => false,
  );

  const shouldShow = useMemo(() => {
    if (!inStandalone) return false;
    try {
      return !localStorage.getItem(ONBOARDING_SEEN_KEY);
    } catch {
      return false;
    }
  }, [inStandalone]);

  const visible = shouldShow && !dismissed;

  const markOnboardingSeen = () => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    } catch {
      // ignore
    }
  };

  const finishAndContinue = () => {
    markOnboardingSeen();
    setDismissed(true);

    if (isLoaded && isSignedIn) {
      router.push("/trips");
      return;
    }

    router.push("/sign-in?redirect_url=/trips");
  };

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 350);
  };

  const next = () => {
    if (current < slides.length - 1) {
      goTo(current + 1);
    } else {
      finishAndContinue();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) {
      next();
    } else if (current > 0) {
      goTo(current - 1);
    }
  };

  if (!visible) return null;

  const isLast = current === slides.length - 1;
  const slide = slides[current];

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Safe-area top + header */}
      <div
        className="px-6 pt-safe"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}
      >
        <div className="flex items-center gap-2 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logowhite.svg"
            alt="Jento"
            width={16}
            height={24}
            className="object-contain"
          />
          <span
            className="text-white font-bold text-xl uppercase tracking-widest"
            style={{ fontFamily: "var(--font-francois-one)" }}
          >
            JENTO
          </span>
        </div>
      </div>

      {/* Slide illustration — fills remaining space above text */}
      <div className="relative flex-1 min-h-0 overflow-hidden px-10 py-6">
        {slides.map((s, i) => (
          <div
            key={s.image}
            className="absolute inset-10 transition-opacity duration-350 ease-in-out"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
          >
            <Image
              src={s.image}
              alt=""
              fill
              className="object-contain"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Text content */}
      <div className="px-8 pt-2 text-center">
        <h2
          className="text-white text-[19px] font-semibold leading-[26px] mb-2 whitespace-pre-line"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {slide.title}
        </h2>
        <p
          className="text-white/55 text-[14px] leading-[20px]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-[7px] py-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 22 : 8,
              height: 8,
              background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* CTA button */}
      <div
        className="flex justify-center px-6"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 32px)",
        }}
      >
        <button
          onClick={next}
          className="min-w-[200px] px-12 bg-white text-black rounded-full py-[14px] text-[15px] font-semibold transition-opacity active:opacity-80"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
