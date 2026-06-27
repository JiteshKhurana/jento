"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeIllustration } from "@/components/ui/theme-illustration";

type NoItineraryEmptyStateProps = {
  onChatClick?: () => void;
};

export function NoItineraryEmptyState({
  onChatClick,
}: NoItineraryEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <ThemeIllustration variant="itinerary" className="mb-4" />
        <p className="font-semibold text-neutral-700">No itinerary yet</p>
        <p className="mt-1 text-sm text-neutral-400">
          Chat with the AI to generate your day-by-day plan
        </p>
        {onChatClick && (
          <Button onClick={onChatClick} className="mt-8 gap-1.5 cursor-pointer">
            <MessageSquare className="h-4 w-4" />
            Chat with AI
          </Button>
        )}
      </div>
    </div>
  );
}
