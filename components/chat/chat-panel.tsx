"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircle, ArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { FollowUpPrompts } from "@/components/chat/follow-up-prompts";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { getAvailableFollowUpPrompts } from "@/lib/chat/follow-up-prompts";
import { MAX_CHATS_PER_TRIP, getChatLimitMessage } from "@/lib/chat/limits";

type ChatPanelProps = {
  tripId: string;
  initialQuery?: string | null;
  initialMessages?: Array<{ role: string; content: string }>;
  hasItinerary?: boolean;
  onItineraryUpdate?: () => void;
  readOnly?: boolean;
};

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
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
  initialQuery = null,
  initialMessages = [],
  hasItinerary = false,
  onItineraryUpdate,
  readOnly = false,
}: ChatPanelProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentInitialQuery = useRef(false);
  const onItineraryUpdateRef = useRef(onItineraryUpdate);

  useEffect(() => {
    onItineraryUpdateRef.current = onItineraryUpdate;
  }, [onItineraryUpdate]);

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
    onFinish: () => {
      onItineraryUpdateRef.current?.();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const chatLimitReached = userMessageCount >= MAX_CHATS_PER_TRIP;
  const usedUserMessages = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user")
        .map((m) => getMessageText(m)),
    [messages],
  );
  const followUpPrompts = useMemo(
    () => getAvailableFollowUpPrompts(hasItinerary, usedUserMessages),
    [hasItinerary, usedUserMessages],
  );
  const lastMessage = messages.at(-1);
  const showFollowUps =
    !readOnly &&
    !chatLimitReached &&
    !isLoading &&
    followUpPrompts.length > 0 &&
    messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    getMessageText(lastMessage).length > 0;

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
    sendMessage({ text: input.trim() });
    setInput("");
  }

  function handlePromptSelect(prompt: string) {
    if (isLoading || chatLimitReached) return;
    setError(null);
    sendMessage({ text: prompt });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-lg space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="space-y-6 pt-8 text-center">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Where would you like to go?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  Tell me about your dream trip — destination, dates, vibe, budget.
                  I&apos;ll build a personalized day-by-day plan.
                </p>
              </div>
              <SuggestedPrompts
                onSelect={handlePromptSelect}
                disabled={isLoading || chatLimitReached}
              />
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
                  <p className="whitespace-pre-wrap">{getMessageText(message)}</p>
                )}
              </div>
            </div>
          ))}

          {showFollowUps && (
            <FollowUpPrompts
              prompts={followUpPrompts}
              onSelect={handlePromptSelect}
              disabled={isLoading || chatLimitReached}
            />
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
          className="shrink-0 border-t border-neutral-100 bg-white px-4 py-4"
        >
          <div className="chat-input-shadow mx-auto flex max-w-lg items-end gap-2 rounded-2xl border border-neutral-200/80 bg-white p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Jento…"
              className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[15px] placeholder:text-neutral-400 focus:outline-none"
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
                <Spinner size="sm" className="text-white" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
