export type ChatFollowUp = {
  label: string;
  message: string;
};

const PRE_ITINERARY_PROMPTS: ChatFollowUp[] = [
  {
    label: "Must-see spots",
    message: "What are the absolute must-see places for a first-time visitor?",
  },
  {
    label: "Best areas to stay",
    message: "Which neighborhoods or areas are best to stay in?",
  },
  {
    label: "Local food to try",
    message: "What local dishes and food experiences should I not miss?",
  },
  {
    label: "Build my itinerary",
    message:
      "I think we have enough details — please create a full day-by-day itinerary.",
  },
];

const POST_ITINERARY_PROMPTS: ChatFollowUp[] = [
  {
    label: "Packing checklist",
    message:
      "Create a practical packing checklist tailored to this destination, season, and trip length.",
  },
  {
    label: "Local etiquette",
    message:
      "What cultural norms, etiquette, and customs should I know before visiting?",
  },
  {
    label: "Safety tips",
    message: "Share practical safety tips and common scams to watch out for.",
  },
  {
    label: "Budget tips",
    message:
      "Any money-saving tips, typical costs, and how much cash I should carry?",
  },
];

export function getFollowUpPrompts(hasItinerary: boolean): ChatFollowUp[] {
  return hasItinerary ? POST_ITINERARY_PROMPTS : PRE_ITINERARY_PROMPTS;
}

export function getAvailableFollowUpPrompts(
  hasItinerary: boolean,
  usedMessages: string[],
): ChatFollowUp[] {
  const used = new Set(usedMessages.map((message) => message.trim()));
  return getFollowUpPrompts(hasItinerary).filter(
    (prompt) => !used.has(prompt.message.trim()),
  );
}
