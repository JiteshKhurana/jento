"use client";

type PopularDestination = {
  label: string;
  query: string;
  emoji: string;
};

const POPULAR: PopularDestination[] = [
  { label: "Tokyo",        query: "Tokyo, Japan",        emoji: "🗼" },
  { label: "Paris",        query: "Paris, France",       emoji: "🗽" },
  { label: "Bali",         query: "Bali, Indonesia",     emoji: "🌴" },
  { label: "New York",     query: "New York, USA",       emoji: "🗽" },
  { label: "Santorini",    query: "Santorini, Greece",   emoji: "🏛️" },
  { label: "Barcelona",    query: "Barcelona, Spain",    emoji: "🎨" },
  { label: "Kyoto",        query: "Kyoto, Japan",        emoji: "⛩️" },
  { label: "Maldives",     query: "Maldives",            emoji: "🏝️" },
];

type Props = {
  onSelect: (query: string) => void;
};

export function PopularDestinations({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs font-medium text-neutral-400">Popular:</span>
      {POPULAR.map((dest) => (
        <button
          key={dest.label}
          type="button"
          onClick={() => onSelect(dest.query)}
          className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-neutral-700 backdrop-blur-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          <span>{dest.emoji}</span>
          {dest.label}
        </button>
      ))}
    </div>
  );
}
