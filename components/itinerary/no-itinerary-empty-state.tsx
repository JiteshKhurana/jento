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
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <ThemeIllustration variant="itinerary" className="mb-6" />
      <h2 className="text-lg font-bold text-neutral-900">No itinerary yet.</h2>
      {onChatClick && (
        <Button onClick={onChatClick} className="mt-8 gap-1.5 cursor-pointer">
          <MessageSquare className="h-4 w-4" />
          Chat with AI
        </Button>
      )}
    </div>
  );
}
