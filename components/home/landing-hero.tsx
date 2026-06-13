"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Plane, Star, Map, Camera } from "lucide-react";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";
import type { FeaturedDestination } from "@/lib/inspire/templates";

interface LandingHeroProps {
  userId: string | null;
  previewPhotos: (UnsplashPhoto | null)[];
  previewDestinations: FeaturedDestination[];
}

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease },
  }),
};

const floatIn = {
  hidden: { opacity: 0, scale: 0.88, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease },
  }),
};

const CARD_POSITIONS = [
  {
    wrapClass: "absolute left-6 top-20 h-56 w-44 -rotate-[7deg] shadow-2xl",
    delay: 0.45,
  },
  {
    wrapClass:
      "absolute left-2 bottom-10 h-40 w-32 rotate-[4deg] shadow-xl opacity-85",
    delay: 0.65,
  },
  {
    wrapClass: "absolute right-6 top-14 h-60 w-48 rotate-[6deg] shadow-2xl",
    delay: 0.55,
  },
  {
    wrapClass:
      "absolute right-4 bottom-8 h-36 w-28 -rotate-[4deg] shadow-xl opacity-85",
    delay: 0.75,
  },
];

const FALLBACK_GRADIENTS = [
  "from-neutral-400 to-neutral-700",
  "from-teal-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-neutral-500 to-neutral-800",
];

export function LandingHero({
  previewPhotos,
  previewDestinations,
}: LandingHeroProps) {
  return (
    <section className="bg-hero relative overflow-hidden px-6 pb-32 pt-20 md:pt-36">
      {/* Floating destination cards — desktop only */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        {CARD_POSITIONS.map(({ wrapClass, delay }, idx) => (
          <motion.div
            key={idx}
            initial="hidden"
            animate="visible"
            custom={delay}
            variants={floatIn}
            className={`overflow-hidden rounded-2xl ${wrapClass}`}
          >
            <div className="relative h-full w-full">
              {previewPhotos[idx] ? (
                <Image
                  src={previewPhotos[idx]!.url}
                  alt={previewDestinations[idx]?.name ?? "destination"}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              ) : (
                <div
                  className={`h-full w-full bg-linear-to-br ${FALLBACK_GRADIENTS[idx % FALLBACK_GRADIENTS.length]}`}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-transparent" />
              {previewDestinations[idx] && (
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-white drop-shadow">
                    {previewDestinations[idx].name}
                  </p>
                  <p className="text-[10px] text-white/80">
                    {previewDestinations[idx].country}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero content */}
      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-100 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-700">
            <Plane className="h-3 w-3" />
            AI-powered travel planning
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeUp}
        >
          <h1 className="text-[clamp(3.5rem,11vw,7rem)] font-black leading-[0.92] tracking-tight text-neutral-900">
            Travel
            <br />
            <span className="text-gradient-warm">better.</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={fadeUp}
          className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-neutral-500 md:text-xl"
        >
          Jento brings the world to you and empowers you to experience it{" "}
          <strong className="font-semibold text-neutral-700">your</strong> way.
        </motion.p>

        {/* Social proof */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.42}
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-500"
        >
          {[
            {
              icon: Star,
              cls: "fill-amber-400 text-amber-400",
              label: "Personalized itineraries",
            },
            { icon: Map, cls: "text-teal-500", label: "Interactive maps" },
            {
              icon: Camera,
              cls: "text-violet-500",
              label: "Real photos & reviews",
            },
          ].map(({ icon: Icon, cls, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon className={`h-4 w-4 ${cls}`} />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
