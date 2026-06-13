"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  Calendar,
  Compass,
  Map,
  MessageSquare,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";
import type { FeaturedDestination } from "@/lib/inspire/templates";

interface LandingPageSectionsProps {
  userId: string | null;
  previewPhotos: (UnsplashPhoto | null)[];
  previewDestinations: FeaturedDestination[];
}

const ease = [0.22, 1, 0.36, 1] as const;

function useReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 36 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.65, delay, ease },
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-widest text-neutral-900">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-900 md:text-4xl lg:text-5xl">
      {children}
    </h2>
  );
}

// ─── Destinations ─────────────────────────────────────────────────────────────

function DestinationsSection({
  previewPhotos,
  previewDestinations,
}: {
  previewPhotos: (UnsplashPhoto | null)[];
  previewDestinations: FeaturedDestination[];
}) {
  return (
    <section className="bg-white px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 flex items-end justify-between">
          <motion.div {...useReveal(0)}>
            <SectionLabel>Get inspired</SectionLabel>
            <SectionHeading>Where will you go next?</SectionHeading>
          </motion.div>
          <motion.div {...useReveal(0.1)} className="hidden sm:block">
            <Link
              href="/inspire"
              className="group flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:border-neutral-400 hover:text-neutral-900"
            >
              See all destinations
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {previewDestinations.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease }}
            >
              <Link href="/inspire" className="card-photo group block">
                <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-neutral-100">
                  {previewPhotos[i] ? (
                    <Image
                      src={previewPhotos[i]!.url}
                      alt={dest.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${
                        [
                          "from-neutral-400 to-neutral-700",
                          "from-teal-400 to-cyan-500",
                          "from-violet-400 to-purple-500",
                          "from-neutral-500 to-neutral-800",
                        ][i % 4]
                      }`}
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-white/75">{dest.country}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dest.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile see all */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/inspire">
            <Button variant="outline" className="rounded-full px-6">
              See all destinations
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Camera,
    iconColor: "text-neutral-900",
    iconBg: "bg-neutral-100",
    borderColor: "hover:border-neutral-300",
    title: "Photos, maps & reviews",
    description:
      "Don't just read about a place — experience it. Vibrant photos, interactive maps, and real traveler reviews for every stop on your journey.",
  },
  {
    icon: Compass,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    borderColor: "hover:border-teal-200",
    title: "Tailored recommendations",
    description:
      "From hidden gems to bucket-list landmarks, your AI travel planner personalizes every suggestion to your style, interests, and budget.",
  },
  {
    icon: Users,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    borderColor: "hover:border-violet-200",
    title: "Plan together",
    description:
      "Share your trip, collaborate in real time, and build an itinerary everyone loves — no endless group texts or spreadsheets required.",
  },
];

function FeaturesSection() {
  return (
    <section className="bg-[#f8f7f5] px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <motion.div {...useReveal(0)} className="text-center">
          <SectionLabel>Everything you need</SectionLabel>
          <SectionHeading>Your ultimate travel companion</SectionHeading>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map(
            (
              {
                icon: Icon,
                iconColor,
                iconBg,
                borderColor,
                title,
                description,
              },
              i,
            ) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
              >
                <div
                  className={`h-full rounded-2xl border border-neutral-100 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md ${borderColor}`}
                >
                  <div
                    className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                    {description}
                  </p>
                </div>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Start chatting",
    description:
      "Ask for suggestions for any destination or a full itinerary. Be as specific as you like about the experiences you love.",
    accent: "text-neutral-900",
    bg: "bg-neutral-100",
  },
  {
    number: "02",
    icon: Calendar,
    title: "Get your plan",
    description:
      "Receive actionable day-by-day itineraries with real photos, reviews, maps, and booking links — instantly.",
    accent: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    number: "03",
    icon: Map,
    title: "Explore on the map",
    description:
      "See every stop plotted geographically. Tap any pin to explore details, photos, and get directions.",
    accent: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    number: "04",
    icon: Users,
    title: "Customize freely",
    description:
      "Edit, reorder, and refine your plan as you chat. Your trip evolves with you — every detail, your way.",
    accent: "text-rose-500",
    bg: "bg-rose-50",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <motion.div {...useReveal(0)} className="text-center">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading>Plan your next adventure in minutes</SectionHeading>
          <p className="mx-auto mt-4 max-w-xl text-neutral-500">
            From first idea to full itinerary — Jento handles the heavy
            lifting so you can focus on the excitement.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(
            ({ number, icon: Icon, title, description, accent, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                className="relative"
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-6 hidden h-px w-8 bg-neutral-200 lg:block lg:translate-x-full" />
                )}
                <div className="mb-5 flex items-center gap-3">
                  <span className="text-4xl font-black text-neutral-100/80 leading-none select-none">
                    {number}
                  </span>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}
                  >
                    <Icon className={`h-5 w-5 ${accent}`} />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {description}
                </p>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CtaSection({ userId }: { userId: string | null }) {
  return (
    <section className="relative overflow-hidden bg-neutral-950 px-8 py-28 text-center text-white md:px-16">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-neutral-500 opacity-20 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-64 w-64 translate-x-1/2 rounded-full bg-teal-400 opacity-15 blur-[80px]" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 opacity-10 blur-[60px]" />
      </div>

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
        className="relative mx-auto max-w-2xl"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">
          Start for free
        </p>
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">
          Your next adventure{" "}
          <span className="text-gradient-warm">starts here.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-neutral-400">
          Join thousands of travellers who plan smarter with Jento. Free to
          start, no credit card required.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="rounded-full bg-white px-8 font-semibold text-neutral-900 shadow-lg shadow-white/10 hover:bg-neutral-100"
            asChild
          >
            <Link href={userId ? "/trips/new" : "/sign-up"}>
              {userId ? "Plan a new trip" : "Get started free"}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/inspire">Browse inspiration</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Composed export ──────────────────────────────────────────────────────────

export function LandingPageSections({
  userId,
  previewPhotos,
  previewDestinations,
}: LandingPageSectionsProps) {
  return (
    <>
      <DestinationsSection
        previewPhotos={previewPhotos}
        previewDestinations={previewDestinations}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection userId={userId} />
    </>
  );
}
