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
  return filterUsedFollowUpPrompts(
    getFollowUpPrompts(hasItinerary),
    usedMessages,
  );
}

export function filterUsedFollowUpPrompts(
  prompts: ChatFollowUp[],
  usedMessages: string[],
): ChatFollowUp[] {
  const used = new Set(usedMessages.map((message) => message.trim()));
  return prompts.filter((prompt) => !used.has(prompt.message.trim()));
}

export function parseFollowUpPromptsFromMetadata(
  metadata: unknown,
): ChatFollowUp[] | null {
  if (!metadata || typeof metadata !== "object") return null;

  const prompts = (metadata as { followUpPrompts?: unknown }).followUpPrompts;
  if (!Array.isArray(prompts)) return null;

  const valid = prompts.filter(
    (prompt): prompt is ChatFollowUp =>
      typeof prompt === "object" &&
      prompt !== null &&
      typeof (prompt as ChatFollowUp).label === "string" &&
      typeof (prompt as ChatFollowUp).message === "string",
  );

  return valid.length > 0 ? valid : null;
}

export function getInitialFollowUpPromptsFromMessages(
  messages: Array<{ role: string; metadata?: unknown }>,
): ChatFollowUp[] | null {
  const last = messages.at(-1);
  if (!last || last.role.toLowerCase() !== "assistant") return null;
  return parseFollowUpPromptsFromMetadata(last.metadata);
}
