"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";
import type { FeaturedDestination } from "@/lib/inspire/templates";
import { LandingTryOutSection } from "@/components/home/landing-try-out-section";
import { LandingQuizSection } from "@/components/home/landing-quiz-section";
import { LandingPlannedYourWaySection } from "@/components/home/landing-planned-your-way-section";

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

// ─── Destinations ─────────────────────────────────────────────────────────────

function DestinationsSection({
  previewPhotos,
  previewDestinations,
}: {
  previewPhotos: (UnsplashPhoto | null)[];
  previewDestinations: FeaturedDestination[];
}) {
  return (
    <section className="px-3 py-16 sm:px-5 md:px-6 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-14 flex items-end justify-between">
          <motion.div {...useReveal(0)}>
            <h2 className="font-francois mt-2 text-3xl font-normal leading-[1.14] text-foreground sm:text-4xl lg:text-5xl">
              Where will you go next?
            </h2>
          </motion.div>
          <motion.div {...useReveal(0.1)} className="hidden sm:block">
            <Link
              href="/inspire"
              className="group flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-all hover:border-muted hover:text-foreground dark:border-transparent dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:hover:text-black"
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
                <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-secondary">
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
            <Button variant="outline" className="rounded-full px-6 dark:border-transparent dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:hover:text-black">
              See all destinations
            </Button>
          </Link>
        </div>
      </div>
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
      <LandingTryOutSection userId={userId} />
      <LandingQuizSection />
      <LandingPlannedYourWaySection />
    </>
  );
}
