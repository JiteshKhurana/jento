"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface LandingHeroProps {
  userId: string | null;
}

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease },
  }),
};

const FEATURE_TAGS = [
  "Personalized itineraries",
  "Interactive maps",
  "Real photos & reviews",
];

export function LandingHero({ userId }: LandingHeroProps) {
  const ctaHref = userId ? "/trips" : "/sign-up";

  return (
    <section className="px-3 py-3 sm:px-5 md:px-6">
      {/* Hero container with rounded corners */}
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-4xl h-[480px] sm:h-[540px] lg:h-[600px]">
        {/* Background image */}
        <Image
          src="/heroBg.png"
          alt="Mountain landscape"
          fill
          className="object-cover object-bottom"
          priority
          sizes="100vw"
        />

        {/* Gradient overlay — darkens right side to make text readable */}
        <div className="absolute inset-0 bg-linear-to-r from-black/20 via-black/10 to-black/50" />

        {/* ── Left content column ───────────────────────────── */}
        <div className="absolute left-5 top-12 flex flex-col gap-8 sm:left-8 sm:top-16 lg:left-12 lg:top-20 lg:gap-10 max-w-[85%] lg:max-w-[52%]">
          {/* Headline + subtitle */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="flex flex-col gap-4"
          >
            <h1 className="font-francois text-white text-[36px] leading-[1.08] sm:text-[44px] lg:text-[56px] lg:leading-[62px]">
              Less planning.
              <br />
              More exploring.
            </h1>
            <p className="text-white/90 text-base sm:text-lg lg:text-xl lg:leading-7 max-w-[420px]">
              AI-powered itineraries curated for any destination.
            </p>
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center bg-white text-black font-medium text-base lg:text-[18px] px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors"
            >
              Get Started →
            </Link>
          </motion.div>
        </div>

        {/* ── Feature tags — bottom left ────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.4}
          variants={fadeUp}
          className="absolute bottom-6 left-5 sm:left-8 lg:left-12 flex flex-wrap gap-2.5 lg:gap-3 lg:max-w-[520px]"
        >
          {FEATURE_TAGS.map((label) => (
            <span
              key={label}
              className="h-10 flex items-center justify-center px-5 rounded-full text-white text-sm lg:text-base backdrop-blur-sm bg-white/15"
            >
              {label}
            </span>
          ))}
        </motion.div>

        {/* ── Right side hero group ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease }}
          className="absolute right-0 top-0 h-full w-[50%] pointer-events-none hidden md:block"
        >
          <Image
            src="/herogroup.png"
            alt="Travel photos collage with polaroid cards, suitcase and accessories"
            fill
            className="object-contain object-top-right"
            priority
            sizes="(min-width: 768px) 50vw, 0px"
          />
        </motion.div>
      </div>
    </section>
  );
}
