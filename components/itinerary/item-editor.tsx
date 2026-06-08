"use client";

import { useState } from "react";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ItemEditorProps = {
  item: {
    id: string;
    title: string;
    description?: string | null;
    startTime?: string | null;
    duration?: string | null;
  };
  onSave: (updates: Partial<ItemEditorProps["item"]>) => Promise<void>;
  onDelete: () => Promise<void>;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  readOnly?: boolean;
};

export function ItemEditor({
  item,
  onSave,
  onDelete,
  dragHandleProps,
  readOnly = false,
}: ItemEditorProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [duration, setDuration] = useState(item.duration ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await onSave({ title, description, startTime, duration });
    setLoading(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Remove this item from your itinerary?")) return;
    setLoading(true);
    await onDelete();
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Start time" />
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration" />
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes"
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      {!readOnly && (
        <button
          type="button"
          className="mt-1 cursor-grab text-neutral-300 hover:text-neutral-500"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          {item.startTime && <span>{item.startTime}</span>}
          {item.duration && <span>· {item.duration}</span>}
        </div>
        <p className="font-medium text-neutral-900">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={handleDelete}
            disabled={loading}
            aria-label={loading ? "Removing item…" : "Remove item"}
          >
            {loading ? (
              <Spinner size="sm" className="text-red-500" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
