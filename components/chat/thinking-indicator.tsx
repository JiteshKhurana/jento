"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  THINKING_MESSAGE_INTERVAL_MS,
  THINKING_MESSAGES,
} from "@/lib/chat/thinking-messages";

export function ThinkingIndicator() {
  const [index, setIndex] = useState(
    () => Math.floor(Math.random() * THINKING_MESSAGES.length),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % THINKING_MESSAGES.length);
    }, THINKING_MESSAGE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400">
      <Spinner size="sm" />
      <span key={index} className="animate-in fade-in duration-300">
        {THINKING_MESSAGES[index]}
      </span>
    </div>
  );
}
