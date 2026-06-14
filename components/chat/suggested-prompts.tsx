"use client";

const PROMPTS = [
  "4 days in Barcelona, art & food",
  "Weekend in Tokyo with great food",
  "Romantic Paris on a moderate budget",
  "Family-friendly Costa Rica",
];

type SuggestedPromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
