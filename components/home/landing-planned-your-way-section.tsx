"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingPlannedYourWaySection() {
  return (
    <section className="px-3 pb-16 sm:px-5 md:px-6 md:pb-20 lg:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease }}
        className="relative mx-auto h-[420px] w-full max-w-7xl overflow-hidden rounded-4xl sm:h-[500px] lg:h-[580px]"
      >
        <Image
          src="/last.png"
          alt="Mountain landscape at golden hour"
          fill
          className="object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />

        <div className="absolute inset-0 flex items-start px-8 pt-24 sm:px-10 sm:pt-28 lg:px-14 lg:pt-32">
          <h2 className="font-francois text-left text-[28px] leading-[1.14] text-black sm:text-[38px] sm:leading-[46px] lg:text-[48px] lg:leading-[56px]">
            Your trip,
            <br />
            planned your way.
          </h2>
        </div>
      </motion.div>
    </section>
  );
}
