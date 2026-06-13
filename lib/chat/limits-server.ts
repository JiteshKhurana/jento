import { prisma } from "@/lib/prisma";
import { MAX_CHATS_PER_TRIP } from "@/lib/chat/limits";

export async function getUserMessageCount(tripId: string) {
  return prisma.chatMessage.count({
    where: { tripId, role: "USER" },
  });
}

export async function isChatLimitReached(tripId: string) {
  const count = await getUserMessageCount(tripId);
  return count >= MAX_CHATS_PER_TRIP;
}
