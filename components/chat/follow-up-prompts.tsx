"use client";

import type { ChatFollowUp } from "@/lib/chat/follow-up-prompts";

type FollowUpPromptsProps = {
  prompts: ChatFollowUp[];
  onSelect: (message: string) => void;
  disabled?: boolean;
};

export function FollowUpPrompts({
  prompts,
  onSelect,
  disabled,
}: FollowUpPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {prompts.map((prompt) => (
        <button
          key={prompt.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt.message)}
          className="cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt.label}
        </button>
      ))}
    </div>
  );
}
