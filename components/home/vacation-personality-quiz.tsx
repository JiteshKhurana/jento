"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuizOption = {
  label: string;
  scores: Record<VacationType, number>;
};

type QuizQuestion = {
  question: string;
  options: QuizOption[];
};

type VacationType = "beach" | "adventure" | "culture" | "food";

const VACATION_TYPES: Record<
  VacationType,
  { title: string; description: string }
> = {
  beach: {
    title: "Beach & Relaxation Seeker",
    description:
      "You recharge by the water. Sun, sand, and slow mornings are your ideal escape.",
  },
  adventure: {
    title: "Adventure Explorer",
    description:
      "You chase thrills and new horizons. Hikes, road trips, and bold experiences call your name.",
  },
  culture: {
    title: "Culture Curator",
    description:
      "You travel to discover stories, art, and history. Museums, neighborhoods, and local life inspire you.",
  },
  food: {
    title: "Food & Flavor Traveler",
    description:
      "Your trips revolve around taste. Markets, restaurants, and regional specialties guide every itinerary.",
  },
};

const QUESTIONS: QuizQuestion[] = [
  {
    question: "What does your perfect morning on vacation look like?",
    options: [
      {
        label: "Coffee on the beach, nowhere to be",
        scores: { beach: 3, adventure: 0, culture: 0, food: 1 },
      },
      {
        label: "An early hike or outdoor activity",
        scores: { beach: 0, adventure: 3, culture: 0, food: 0 },
      },
      {
        label: "A walking tour through a historic district",
        scores: { beach: 0, adventure: 1, culture: 3, food: 0 },
      },
      {
        label: "Finding the best local breakfast spot",
        scores: { beach: 0, adventure: 0, culture: 1, food: 3 },
      },
    ],
  },
  {
    question: "Which trip detail matters most to you?",
    options: [
      {
        label: "A beautiful place to unwind",
        scores: { beach: 3, adventure: 0, culture: 0, food: 0 },
      },
      {
        label: "Unique experiences off the beaten path",
        scores: { beach: 0, adventure: 3, culture: 1, food: 0 },
      },
      {
        label: "Landmarks, museums, and local traditions",
        scores: { beach: 0, adventure: 0, culture: 3, food: 1 },
      },
      {
        label: "Great food and drink everywhere you go",
        scores: { beach: 1, adventure: 0, culture: 0, food: 3 },
      },
    ],
  },
  {
    question: "How do you like to spend your evenings?",
    options: [
      {
        label: "Sunset views and a quiet night in",
        scores: { beach: 3, adventure: 0, culture: 0, food: 0 },
      },
      {
        label: "Something active or outdoors before dinner",
        scores: { beach: 0, adventure: 3, culture: 0, food: 1 },
      },
      {
        label: "A show, gallery, or neighborhood to explore",
        scores: { beach: 0, adventure: 0, culture: 3, food: 0 },
      },
      {
        label: "Trying a highly recommended restaurant",
        scores: { beach: 0, adventure: 0, culture: 1, food: 3 },
      },
    ],
  },
];

function getResult(scores: Record<VacationType, number>): VacationType {
  return (Object.entries(scores) as [VacationType, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
}

interface VacationPersonalityQuizProps {
  embedded?: boolean;
  onBack?: () => void;
}

export function VacationPersonalityQuiz({
  embedded = false,
  onBack,
}: VacationPersonalityQuizProps = {}) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<VacationType, number>>({
    beach: 0,
    adventure: 0,
    culture: 0,
    food: 0,
  });

  const finished = step >= QUESTIONS.length;
  const result = finished ? VACATION_TYPES[getResult(scores)] : null;

  function handleAnswer(option: QuizOption) {
    const nextScores = { ...scores };
    for (const [type, value] of Object.entries(option.scores) as [
      VacationType,
      number,
    ][]) {
      nextScores[type] += value;
    }
    const nextStep = step + 1;

    if (nextStep >= QUESTIONS.length) {
      const resultType = getResult(nextScores);
      const resultData = VACATION_TYPES[resultType];
      if (typeof pendo !== "undefined") {
        pendo.track("vacation_quiz_completed", {
          resultType,
          resultTitle: resultData.title,
          beachScore: nextScores.beach,
          adventureScore: nextScores.adventure,
          cultureScore: nextScores.culture,
          foodScore: nextScores.food,
        });
      }
    }

    setScores(nextScores);
    setStep(nextStep);
  }

  function restart() {
    setStep(0);
    setScores({ beach: 0, adventure: 0, culture: 0, food: 0 });
  }

  const backControl =
    embedded && onBack ? (
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-black/70 transition-colors hover:text-black dark:text-white/70 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    ) : !embedded ? (
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    ) : null;

  const questionLabelClass = embedded
    ? "text-sm font-medium uppercase tracking-widest text-black/60 dark:text-white/60"
    : "text-sm font-medium uppercase tracking-widest text-muted-foreground";

  const headingClass = embedded
    ? "font-francois text-2xl leading-[1.14] text-black dark:text-white sm:text-3xl lg:text-4xl"
    : "font-francois text-3xl leading-[1.14] text-foreground sm:text-4xl";

  const bodyClass = embedded
    ? "text-base leading-7 text-black/80 dark:text-white/80 sm:text-lg"
    : "text-lg leading-8 text-muted-foreground";

  const optionClass = embedded
    ? "cursor-pointer rounded-2xl border border-black/10 bg-white/90 px-5 py-4 text-left text-base text-black transition-colors hover:border-black/20 hover:bg-white dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:border-white/30 dark:hover:bg-black/55"
    : "cursor-pointer rounded-2xl border border-border bg-card px-5 py-4 text-left text-base text-foreground transition-colors hover:border-foreground/30 hover:bg-accent";

  const content = (
    <>
      {backControl}

      {!finished && (
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <p className={questionLabelClass}>
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h2 className={headingClass}>{QUESTIONS[step].question}</h2>
          </div>

          <div className="grid gap-3">
            {QUESTIONS[step].options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleAnswer(option)}
                className={optionClass}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && result && (
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <p className={questionLabelClass}>Your vacation personality</p>
            <h2 className={headingClass}>{result.title}</h2>
            <p className={bodyClass}>{result.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className={
                embedded
                  ? "font-inter cursor-pointer rounded-full bg-black px-6 font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  : "font-francois cursor-pointer rounded-full px-6"
              }
            >
              <Link href="/explore">Find destinations</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className={
                embedded
                  ? "font-inter cursor-pointer rounded-full border-black/20 bg-transparent font-semibold text-black hover:bg-black/5 hover:text-black dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                  : "font-francois cursor-pointer rounded-full hover:text-foreground dark:hover:text-black"
              }
              onClick={restart}
            >
              Take Quiz again
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="relative z-10 w-full px-8 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">{content}</div>
    </div>
  );
}
