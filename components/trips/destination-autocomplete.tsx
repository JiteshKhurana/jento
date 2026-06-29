"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plus, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SelectedLocation = {
  id: string;
  name: string;
  label: string;
  countryCode: string;
  stateCode?: string;
  latitude?: string;
  longitude?: string;
};

type Suggestion = SelectedLocation & {
  type: "city" | "state" | "country";
};

type DestinationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: SelectedLocation) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  leadingIcon?: "map-pin" | "search";
  leadingIconClassName?: string;
  disabled?: boolean;
};

export function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Where are you headed?",
  autoFocus,
  className,
  inputClassName,
  leadingIcon = "map-pin",
  leadingIconClassName,
  disabled,
}: DestinationAutocompleteProps) {
  const isMobile = useIsMobile();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const query = value.trim();
  const isSearchable = query.length >= 2;
  const visibleSuggestions = isSearchable ? suggestions : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSearchable) return;

    const requestId = ++requestIdRef.current;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/locations/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as Suggestion[];
        if (requestId !== requestIdRef.current) return;
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(0);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isSearchable, query]);

  function pick(suggestion: Suggestion) {
    onSelect({
      id: suggestion.id,
      name: suggestion.name,
      label: suggestion.label,
      countryCode: suggestion.countryCode,
      stateCode: suggestion.stateCode,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    onChange("");
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || visibleSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (i) => (i - 1 + visibleSuggestions.length) % visibleSuggestions.length,
      );
    } else if (e.key === "Enter" && visibleSuggestions[activeIndex]) {
      e.preventDefault();
      pick(visibleSuggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        {leadingIcon === "search" ? (
          <Search
            className={cn(
              "pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400",
              leadingIconClassName,
            )}
          />
        ) : (
          <MapPin
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400",
              leadingIconClassName,
            )}
          />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (visibleSuggestions.length > 0) setOpen(true);
            if (isMobile) {
              requestAnimationFrame(() => {
                inputRef.current?.scrollIntoView({
                  block: "nearest",
                  behavior: "smooth",
                });
              });
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={cn(
            leadingIcon === "search" ? "pl-12 pr-12" : "pl-9 pr-9",
            inputClassName,
          )}
        />
        {isSearchable && loading && (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {open && visibleSuggestions.length > 0 && (
        <ul
          className={cn(
            "z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg",
            isMobile ? "relative" : "absolute",
          )}
        >
          {visibleSuggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(suggestion)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50",
                  index === activeIndex && "bg-neutral-50",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <span>
                  <span className="font-medium text-neutral-900">
                    {suggestion.name}
                  </span>
                  {suggestion.label !== suggestion.name && (
                    <span className="block text-xs text-neutral-500">
                      {suggestion.label}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type LocationChipProps = {
  location: SelectedLocation;
  onRemove: () => void;
  actionLabel?: string;
};

export function LocationChip({
  location,
  onRemove,
  actionLabel,
}: LocationChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-200/80">
        <MapPin className="h-4 w-4 text-neutral-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {location.name}
        </p>
        {location.label !== location.name && (
          <p className="truncate text-xs text-neutral-500">{location.label}</p>
        )}
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 cursor-pointer"
          aria-label={`Remove ${location.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function AddLocationButton({
  onClick,
  label = "Add location",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
