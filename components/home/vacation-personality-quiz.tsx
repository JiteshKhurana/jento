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

export function VacationPersonalityQuiz() {
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
    setScores((current) => {
      const next = { ...current };
      for (const [type, value] of Object.entries(option.scores) as [
        VacationType,
        number,
      ][]) {
        next[type] += value;
      }
      return next;
    });
    setStep((current) => current + 1);
  }

  function restart() {
    setStep(0);
    setScores({ beach: 0, adventure: 0, culture: 0, food: 0 });
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {!finished && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <h1 className="font-francois text-3xl leading-[1.14] text-black sm:text-4xl">
                {QUESTIONS[step].question}
              </h1>
            </div>

            <div className="grid gap-3">
              {QUESTIONS[step].options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left text-base text-neutral-900 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {finished && result && (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
                Your vacation personality
              </p>
              <h1 className="font-francois text-3xl leading-[1.14] text-black sm:text-4xl">
                {result.title}
              </h1>
              <p className="text-lg leading-8 text-neutral-700">
                {result.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="font-francois rounded-full bg-black px-6 hover:bg-neutral-800"
              >
                <Link href="/inspire">Find destinations</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="font-francois rounded-full"
                onClick={restart}
              >
                Take Quiz again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
