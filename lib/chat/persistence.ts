import { prisma } from "@/lib/prisma";
import type { MessageRole } from "@/app/generated/prisma/enums";
import type { ChatFollowUp } from "@/lib/chat/follow-up-prompts";

async function saveMessageIfNew(
  tripId: string,
  role: MessageRole,
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) return;

  const last = await prisma.chatMessage.findFirst({
    where: { tripId, role },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  });

  if (last?.content === trimmed) return;

  await prisma.chatMessage.create({
    data: { tripId, role, content: trimmed },
  });
}

export function saveUserMessageIfNew(tripId: string, content: string) {
  return saveMessageIfNew(tripId, "USER", content);
}

export function saveAssistantMessageIfNew(tripId: string, content: string) {
  return saveMessageIfNew(tripId, "ASSISTANT", content);
}

export async function saveFollowUpPromptsToLastAssistant(
  tripId: string,
  prompts: ChatFollowUp[],
) {
  const lastAssistant = await prisma.chatMessage.findFirst({
    where: { tripId, role: "ASSISTANT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, metadata: true },
  });
  if (!lastAssistant) return;

  const existing =
    typeof lastAssistant.metadata === "object" && lastAssistant.metadata !== null
      ? lastAssistant.metadata
      : {};

  await prisma.chatMessage.update({
    where: { id: lastAssistant.id },
    data: {
      metadata: { ...existing, followUpPrompts: prompts },
    },
  });
}

type FinishStep = {
  text: string;
  toolResults?: Array<{ toolName: string; output: unknown }>;
};

function itineraryWasSaved(steps: FinishStep[]) {
  return steps.some((step) =>
    step.toolResults?.some((result) => {
      if (result.toolName !== "saveItinerary" && result.toolName !== "updateItineraryDay") {
        return false;
      }
      return (
        typeof result.output === "object" &&
        result.output !== null &&
        "success" in result.output &&
        result.output.success === true
      );
    }),
  );
}

export function getAssistantTextFromFinish(steps: FinishStep[]) {
  const text = steps
    .map((step) => step.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (text) return text;

  if (itineraryWasSaved(steps)) {
    return "Your itinerary is ready — open the Itinerary tab to review the day-by-day plan.";
  }

  return "I've updated your trip plan. Check the Itinerary tab for details.";
}
