"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    label: "Choose destination",
    icon: "/landing/icon-search.svg",
    iconAlt: "Search icon",
  },
  {
    label: "Customize choices",
    icon: "/landing/icon-pointer.svg",
    iconAlt: "Pointer icon",
  },
  {
    label: "Add your preferences",
    icon: "/landing/icon-wand.svg",
    iconAlt: "Magic wand icon",
  },
  {
    label: "Itinerary is\nReady!",
    icon: "/landing/icon-rocket.svg",
    iconAlt: "Rocket icon",
  },
] as const;

export function LandingItinerarySteps() {
  return (
    <section className="px-4 py-16 sm:px-6 md:px-8 md:py-20 lg:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:gap-[60px]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease }}
          className="w-full text-center"
        >
          <h2 className="font-francois text-[32px] leading-[1.14] text-black dark:text-white sm:text-[44px] sm:leading-[52px] lg:text-[56px] lg:leading-[64px]">
            Your perfect itinerary,
            <br />
            generated in seconds.
          </h2>
        </motion.div>

        <div className="w-full overflow-x-auto pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max min-w-full justify-center gap-4 px-1 sm:gap-5 md:gap-6 lg:gap-[24px]">
            {STEPS.map(({ label, icon, iconAlt }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
                className="flex h-[220px] w-[140px] shrink-0 flex-col items-center justify-center gap-7 rounded-[120px] bg-[#f9c993] px-4 py-5 dark:bg-[#FF8800]/40 sm:h-[250px] sm:w-[160px] sm:gap-8 sm:rounded-[140px] md:h-[273px] md:w-[186px] md:gap-9 md:rounded-[162px] lg:w-[188px]"
              >
                <p className="whitespace-pre-line text-center text-sm font-medium leading-6 text-black dark:text-white sm:text-base md:text-[18px] md:leading-6">
                  {label}
                </p>
                <div className="relative size-12 sm:size-14 md:size-[60px]">
                  <Image
                    src={icon}
                    alt={iconAlt}
                    fill
                    className="object-contain dark:brightness-0 dark:invert"
                    sizes="60px"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
