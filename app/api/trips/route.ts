import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return prisma.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      name: clerkUser.fullName ?? null,
      profileImageUrl: clerkUser.imageUrl ?? null,
    },
  });
}

export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      itineraries: {
        where: { isActive: true },
        include: { days: { include: { items: true } } },
        take: 1,
      },
    },
  });

  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, destination, startDate, endDate, preferences } = body;

  if (!title || !destination) {
    return NextResponse.json(
      { error: "Title and destination are required" },
      { status: 400 },
    );
  }

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      title,
      destination,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      preferences: preferences ?? {},
    },
  });

  return NextResponse.json(trip, { status: 201 });
}
