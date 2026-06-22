"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { VacationPersonalityQuiz } from "@/components/home/vacation-personality-quiz";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingQuizSection() {
  const [started, setStarted] = useState(false);

  return (
    <section id="quiz" className="px-3 py-16 sm:px-5 md:px-6 md:py-20 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease }}
        className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8"
      >
        <h2 className="font-francois text-left text-3xl leading-[1.14] text-black dark:text-white sm:text-4xl lg:text-5xl">
          Take Quiz to find
        </h2>

        <div className="w-full rounded-4xl">
          <div className="relative flex min-h-[280px] flex-col overflow-hidden rounded-[30px] sm:min-h-[320px] lg:min-h-[420px] lg:flex-row lg:items-center">
            <div
              className="absolute inset-0 bg-[linear-gradient(to_left,#FF8800_0%,rgba(255,136,0,0.4)_100%)] opacity-40"
              aria-hidden
            />

            {started ? (
              <VacationPersonalityQuiz
                embedded
                onBack={() => setStarted(false)}
              />
            ) : (
              <>
                <div className="relative z-10 flex flex-1 flex-col justify-center gap-6 px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                  <p className="max-w-md text-base font-normal leading-snug text-black dark:text-white sm:text-lg lg:text-xl">
                    Find out which kind of a vacation person are you?
                  </p>
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="font-inter inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-black px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    Begin Quiz
                  </button>
                </div>

                <div className="relative z-10 flex shrink-0 items-end justify-center px-6 pb-6 pt-2 sm:px-10 lg:w-[42%] lg:justify-end lg:px-8 lg:pb-0 lg:pt-0">
                  <div className="relative aspect-4/3 w-full max-w-[420px] lg:aspect-auto lg:h-[380px] lg:max-w-none">
                    <Image
                      src="/quizsuit.png"
                      alt="Travel suitcase with sun hat, palm tree, and hiking boot"
                      fill
                      className="object-contain object-bottom lg:object-bottom-right"
                      sizes="(max-width: 1024px) 90vw, 42vw"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
