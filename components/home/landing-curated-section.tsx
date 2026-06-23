"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingCuratedSection() {
  return (
    <section className="relative overflow-hidden px-3 py-16 sm:px-5 md:px-6 md:py-20 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 z-0 size-[min(100%,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full sm:size-208 lg:size-240 bg-[radial-gradient(circle_closest-side_at_center,#FFB867_0%,#F8F8F8_100%)] dark:bg-[radial-gradient(circle_closest-side_at_center,#C16700_0%,#000000_100%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl overflow-hidden">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease }}
            className="w-full min-w-0 lg:flex-55"
          >
            <div className="relative mx-auto aspect-770/764 w-full overflow-hidden rounded-[32px] sm:rounded-[40px]">
              <Image
                src="/curated.png"
                alt="Trip planning interface showing destination search, timing, and trip pace preferences"
                fill
                className="object-contain object-center"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="w-full min-w-0 lg:flex-45"
          >
            <div className="flex flex-col gap-4 text-center lg:text-left">
              <h2 className="font-francois text-[32px] leading-[1.14] text-black dark:text-white sm:text-[44px] sm:leading-[52px] lg:text-[56px] lg:leading-[64px]">
                Curated for you
              </h2>
              <p className="text-base leading-7 text-black dark:text-white sm:text-lg sm:leading-8 lg:text-[20px] lg:leading-8">
                Tell us your preferences, and we&apos;ll build a trip
                you&apos;ll love.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
