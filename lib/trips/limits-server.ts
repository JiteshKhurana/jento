import { prisma } from "@/lib/prisma";
import { MAX_TRIPS_PER_USER } from "@/lib/trips/limits";

export async function getUserTripCount(userId: string) {
  return prisma.trip.count({ where: { userId } });
}

export async function isTripLimitReached(userId: string) {
  const count = await getUserTripCount(userId);
  return count >= MAX_TRIPS_PER_USER;
}
