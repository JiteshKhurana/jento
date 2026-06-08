import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  return prisma.user.findUnique({ where: { clerkId } });
}

export async function requireCurrentDbUser() {
  const user = await getCurrentDbUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

const tripDetailInclude = {
  messages: { orderBy: { createdAt: "asc" as const } },
  itineraries: {
    where: { isActive: true },
    include: {
      days: {
        orderBy: { dayNumber: "asc" as const },
        include: {
          items: {
            orderBy: { sortOrder: "asc" as const },
            include: { placeCache: true },
          },
        },
      },
    },
    take: 1,
  },
} as const;

export async function getTripById(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: tripDetailInclude,
  });
}

export async function getTripForUser(tripId: string, userId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: tripDetailInclude,
  });
}

export function isTripOwner(trip: { userId: string }, userId: string) {
  return trip.userId === userId;
}

export async function requireTripForUser(tripId: string, userId: string) {
  const trip = await getTripForUser(tripId, userId);
  if (!trip) {
    throw new Error("Trip not found");
  }
  return trip;
}
