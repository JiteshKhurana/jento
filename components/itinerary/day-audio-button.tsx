"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DayAudioButtonProps = {
  tripId: string;
  dayNumber: number;
  /** Used to invalidate the cached narration when the day changes. */
  contentKey?: string;
  color?: string;
};

type AudioState = "idle" | "loading" | "playing";

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Prefer a natural-sounding English voice when available.
  const preferred = ["Samantha", "Google US English", "Microsoft Aria"];
  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

export function DayAudioButton({
  tripId,
  dayNumber,
  contentKey,
  color = "#171717",
}: DayAudioButtonProps) {
  const [state, setState] = useState<AudioState>("idle");
  const supported = useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );
  const cacheRef = useRef<{ key: string | undefined; narration: string } | null>(
    null,
  );

  // Stop any speech from this button when it unmounts (e.g. switching days).
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
  }

  async function play() {
    if (state === "playing") {
      stop();
      return;
    }
    if (state === "loading") return;

    setState("loading");
    try {
      const cached = cacheRef.current;
      let narration =
        cached != null && cached.key === contentKey ? cached.narration : null;

      if (!narration) {
        const res = await fetch(
          `/api/trips/${tripId}/days/${dayNumber}/narrate`,
        );
        if (!res.ok) throw new Error("Failed to fetch narration");
        const data = await res.json();
        narration = data.narration as string;
        cacheRef.current = { key: contentKey, narration };
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(narration);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setState("idle");
      utterance.onerror = () => setState("idle");
      window.speechSynthesis.speak(utterance);
      setState("playing");
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={
        state === "playing"
          ? "Stop reading day summary"
          : "Listen to day summary"
      }
      title={state === "playing" ? "Stop" : "Listen to this day"}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-white",
        state === "playing" && "animate-pulse",
      )}
      style={{ color }}
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}
