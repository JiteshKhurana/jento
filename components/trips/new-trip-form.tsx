"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { getCreateTripErrorMessage } from "@/lib/trips/limits";

function extractDestination(prompt: string): string {
  const inMatch = prompt.match(
    /\b(?:in|to)\s+([A-Za-z][A-Za-z\s,]{2,40}?)(?:\s+(?:for|with|focusing|on|and)|[,.]|$)/i,
  );
  if (inMatch?.[1]) return inMatch[1].trim();
  return prompt.slice(0, 40).trim() || "New trip";
}

export function NewTripForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [destination, setDestination] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function createTrip(data: {
    title: string;
    destination: string;
    startDate?: string | null;
    endDate?: string | null;
    initialMessage?: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          destination: data.destination,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
        }),
      });

      if (!res.ok) {
        throw new Error(await getCreateTripErrorMessage(res));
      }

      const trip = await res.json();
      const q = data.initialMessage
        ? `?q=${encodeURIComponent(data.initialMessage)}`
        : "";
      router.push(`/trips/${trip.id}${q}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setLoading(false);
    }
  }

  function handleQuickStart(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    const dest = extractDestination(prompt);
    createTrip({
      title: title || `${dest} trip`,
      destination: dest,
      initialMessage: prompt.trim(),
    });
  }

  function handleDetailedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim()) return;
    createTrip({
      title: title || `${destination} trip`,
      destination,
      startDate,
      endDate,
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          Where to next?
        </h1>
        <p className="mt-3 text-neutral-500">
          Start chatting — tell us where you want to go and we&apos;ll take it
          from there.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <form onSubmit={handleQuickStart}>
        <div className="chat-input-shadow overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 4 days in Barcelona focusing on art and local food…"
            rows={4}
            disabled={loading}
            className="w-full resize-none border-0 bg-transparent px-5 py-4 text-base placeholder:text-neutral-400 focus:outline-none"
          />
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              {showDetails ? "Hide details" : "+ Add dates & details"}
            </button>
            <Button
              type="submit"
              size="icon"
              disabled={loading || !prompt.trim()}
              className="rounded-full"
              aria-label={loading ? "Creating trip…" : "Create trip"}
            >
              {loading ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {showDetails && (
        <form
          onSubmit={handleDetailedSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Destination
            </label>
            <Input
              required={showDetails}
              placeholder="Barcelona, Spain"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Trip name{" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <Input
              placeholder="Art & food in Barcelona"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Start
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                End
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !destination}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="text-white" />
                Creating…
              </>
            ) : (
              "Create trip"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
