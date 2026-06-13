export const MAX_CHATS_PER_TRIP = 20;

export function getChatLimitMessage() {
  return `You've reached the ${MAX_CHATS_PER_TRIP} message limit for this trip.`;
}
