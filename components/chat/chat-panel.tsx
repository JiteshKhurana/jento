"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircle, ArrowUp, CalendarDays, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { FollowUpPrompts } from "@/components/chat/follow-up-prompts";
import {
  filterUsedFollowUpPrompts,
  getAvailableFollowUpPrompts,
  type ChatFollowUp,
} from "@/lib/chat/follow-up-prompts";
import { MAX_CHATS_PER_TRIP, getChatLimitMessage } from "@/lib/chat/limits";
import type { TripPreferences } from "@/lib/trips/preferences";
import { cn } from "@/lib/utils";

// Module-level Set to ensure chat_limit_reached fires once per trip per session
const chatLimitTrackedTrips = new Set<string>();

type TripContext = {
  destination: string;
  preferences?: TripPreferences | null;
};

type ChatPanelProps = {
  tripId: string;
  trip?: TripContext;
  initialQuery?: string | null;
  initialMessages?: Array<{ role: string; content: string }>;
  initialFollowUpPrompts?: ChatFollowUp[] | null;
  hasItinerary?: boolean;
  onItineraryUpdate?: () => void;
  readOnly?: boolean;
  onCalendarClick?: () => void;
  onMapClick?: () => void;
  activeRightView?: "map" | "calendar";
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollContainerClassName?: string;
};

function getMessageText(message: {
  parts?: Array<{ type: string; text?: string }>;
}): string {
  return (
    message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("") ?? ""
  );
}

function getInitialQueryStorageKey(tripId: string) {
  return `jento-initial-query-sent:${tripId}`;
}

export function ChatPanel({
  tripId,
  trip,
  initialQuery = null,
  initialMessages = [],
  initialFollowUpPrompts = null,
  hasItinerary = false,
  onItineraryUpdate,
  readOnly = false,
  onCalendarClick,
  onMapClick,
  activeRightView,
  onScroll,
  scrollContainerClassName,
}: ChatPanelProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<ChatFollowUp[] | null>(
    initialFollowUpPrompts,
  );
  const [promptsLoading, setPromptsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentInitialQuery = useRef(false);
  const fetchedLegacyPrompts = useRef(Boolean(initialFollowUpPrompts?.length));
  const onItineraryUpdateRef = useRef(onItineraryUpdate);

  useEffect(() => {
    onItineraryUpdateRef.current = onItineraryUpdate;
  }, [onItineraryUpdate]);

  const fetchDynamicPrompts = useCallback(
    async (currentMessages: Array<{ role: string; content: string }>) => {
      if (!trip || readOnly) return;
      setPromptsLoading(true);
      try {
        const res = await fetch(
          `/api/trips/${tripId}/follow-up-prompts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hasItinerary,
              recentMessages: currentMessages.slice(-6),
            }),
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.prompts)) {
          setDynamicPrompts(data.prompts as ChatFollowUp[]);
        }
      } catch {
        // fall back to static prompts silently
      } finally {
        setPromptsLoading(false);
      }
    },
    [tripId, trip, hasItinerary, readOnly],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { tripId },
      }),
    [tripId],
  );

  const seededMessages = useMemo(
    () =>
      initialMessages.map((m, i) => ({
        id: `initial-${i}`,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      })),
    [initialMessages],
  );

  const { messages, sendMessage, status } = useChat({
    id: tripId,
    transport,
    messages: seededMessages,
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
    onFinish: ({ messages: allMessages }) => {
      onItineraryUpdateRef.current?.();
      const plainMessages = allMessages.map((m) => ({
        role: m.role,
        content:
          m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("") ?? "",
      }));
      fetchDynamicPrompts(plainMessages);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const chatLimitReached = userMessageCount >= MAX_CHATS_PER_TRIP;

  useEffect(() => {
    if (chatLimitReached && !chatLimitTrackedTrips.has(tripId)) {
      chatLimitTrackedTrips.add(tripId);
      if (typeof pendo !== "undefined") {
        pendo.track("chat_limit_reached", {
          tripId,
          messageCount: userMessageCount,
          maxMessages: MAX_CHATS_PER_TRIP,
        });
      }
    }
  }, [chatLimitReached, tripId, userMessageCount]);

  const usedUserMessages = useMemo(
    () =>
      messages.filter((m) => m.role === "user").map((m) => getMessageText(m)),
    [messages],
  );
  const staticFollowUpPrompts = useMemo(
    () => getAvailableFollowUpPrompts(hasItinerary, usedUserMessages),
    [hasItinerary, usedUserMessages],
  );
  const followUpPrompts = useMemo(() => {
    const base = dynamicPrompts ?? staticFollowUpPrompts;
    return dynamicPrompts
      ? filterUsedFollowUpPrompts(base, usedUserMessages)
      : base;
  }, [dynamicPrompts, staticFollowUpPrompts, usedUserMessages]);
  const lastMessage = messages.at(-1);
  const showFollowUps =
    !readOnly &&
    !chatLimitReached &&
    !isLoading &&
    messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    getMessageText(lastMessage).length > 0 &&
    (promptsLoading || followUpPrompts.length > 0);

  useEffect(() => {
    if (fetchedLegacyPrompts.current || readOnly || !trip) return;
    if (initialFollowUpPrompts?.length) return;
    if (status !== "ready") return;

    const last = messages.at(-1);
    if (!last || last.role !== "assistant") return;
    if (!getMessageText(last)) return;

    fetchedLegacyPrompts.current = true;
    const plainMessages = messages.map((m) => ({
      role: m.role,
      content: getMessageText(m),
    }));
    fetchDynamicPrompts(plainMessages);
  }, [
    fetchDynamicPrompts,
    initialFollowUpPrompts,
    messages,
    readOnly,
    status,
    trip,
  ]);

  useEffect(() => {
    if (
      !initialQuery ||
      sentInitialQuery.current ||
      status !== "ready" ||
      chatLimitReached
    ) {
      return;
    }

    const storageKey = getInitialQueryStorageKey(tripId);
    if (sessionStorage.getItem(storageKey) === initialQuery) {
      sentInitialQuery.current = true;
      router.replace(`/trips/${tripId}`, { scroll: false });
      return;
    }

    sentInitialQuery.current = true;
    sessionStorage.setItem(storageKey, initialQuery);
    router.replace(`/trips/${tripId}`, { scroll: false });
    sendMessage({ text: initialQuery });
  }, [chatLimitReached, initialQuery, sendMessage, status, tripId, router]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || chatLimitReached) return;
    setError(null);
    setDynamicPrompts(null);
    if (typeof pendo !== "undefined") {
      pendo.track("chat_message_sent", {
        tripId,
        messageLength: input.trim().length,
        messageSource: "typed",
        hasItinerary,
        userMessageCount: userMessageCount + 1,
        isFollowUpPrompt: false,
      });
    }
    sendMessage({ text: input.trim() });
    setInput("");
  }

  function handlePromptSelect(prompt: string) {
    if (isLoading || chatLimitReached) return;
    setError(null);
    setDynamicPrompts(null);
    if (typeof pendo !== "undefined") {
      pendo.track("chat_message_sent", {
        tripId,
        messageLength: prompt.length,
        messageSource: "follow_up_prompt",
        hasItinerary,
        userMessageCount: userMessageCount + 1,
        isFollowUpPrompt: true,
      });
    }
    sendMessage({ text: prompt });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-6", scrollContainerClassName)}
      >
        <div className="mx-auto max-w-lg space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="space-y-6 pt-8 text-center">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Where would you like to go?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Tell me about your dream trip — destination, dates, vibe,
                  budget. I&apos;ll build a personalized day-by-day plan.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] text-[15px] leading-relaxed ${
                  message.role === "user"
                    ? "rounded-2xl rounded-br-md bg-neutral-900 px-4 py-2.5 text-white"
                    : "text-neutral-800"
                }`}
              >
                {message.role === "assistant" ? (
                  <ChatMarkdown content={getMessageText(message)} />
                ) : (
                  <p className="whitespace-pre-wrap">
                    {getMessageText(message)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {showFollowUps && (
            promptsLoading ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {[88, 104, 76, 96].map((w) => (
                  <div
                    key={w}
                    className="h-8 animate-pulse rounded-full bg-neutral-100"
                    style={{ width: w }}
                  />
                ))}
              </div>
            ) : (
              <FollowUpPrompts
                prompts={followUpPrompts}
                onSelect={handlePromptSelect}
                disabled={isLoading || chatLimitReached}
              />
            )
          )}

          {isLoading && <ThinkingIndicator />}

          {chatLimitReached && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {getChatLimitMessage()}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>

      {readOnly ? (
        <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-500">
          Chat is read-only on shared trips.
        </div>
      ) : chatLimitReached ? (
        <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-500">
          {getChatLimitMessage()}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3"
        >
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <div className="chat-input-shadow flex flex-1 items-center gap-1.5 rounded-2xl border border-neutral-200/80 bg-white p-1.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Jento…"
                className="max-h-32 min-h-9 flex-1 resize-none border-0 bg-transparent px-2.5 py-1.5 text-[15px] leading-5 placeholder:text-neutral-400 focus:outline-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                disabled={isLoading || !input.trim()}
                aria-label={isLoading ? "Sending message…" : "Send message"}
              >
                {isLoading ? (
                  <Spinner size="sm" className="text-current" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {(onMapClick || onCalendarClick) && (
              <div className="flex shrink-0 items-center gap-1.5">
                {onMapClick && (
                  <button
                    type="button"
                    onClick={onMapClick}
                    aria-label="Show map"
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                      activeRightView === "map"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700",
                    )}
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                )}
                {onCalendarClick && (
                  <button
                    type="button"
                    onClick={onCalendarClick}
                    aria-label="Show calendar"
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                      activeRightView === "calendar"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700",
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
