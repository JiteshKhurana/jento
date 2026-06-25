"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TripTitleEditorProps = {
  tripId: string;
  title: string;
  onTitleChange: (title: string) => void;
  readOnly?: boolean;
};

export function TripTitleEditor({
  tripId,
  title,
  onTitleChange,
  readOnly = false,
}: TripTitleEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function save(nextTitle: string) {
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === title) {
      setDraft(title);
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update title");
      if (typeof pendo !== "undefined") {
        pendo.track("trip_title_updated", {
          tripId,
          oldTitle: title,
          newTitle: trimmed,
        });
      }
      onTitleChange(trimmed);
      setEditing(false);
    } catch {
      setDraft(title);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (readOnly) {
    return <h1 className="text-base font-semibold text-neutral-900">{title}</h1>;
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save(draft);
          }
          if (e.key === "Escape") {
            setDraft(title);
            setEditing(false);
          }
        }}
        className="h-8 max-w-xs px-2 py-1 text-base font-semibold"
        aria-label="Trip title"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-md text-left text-base font-semibold text-neutral-900",
        "hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/60",
      )}
      aria-label="Edit trip title"
    >
      <span>{title}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );
}
