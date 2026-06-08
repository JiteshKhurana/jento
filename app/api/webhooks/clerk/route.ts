import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address ?? null;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, name, profileImageUrl: image_url },
        create: {
          clerkId: id,
          email,
          name,
          profileImageUrl: image_url,
        },
      });
    }

    if (evt.type === "user.deleted") {
      const { id } = evt.data;
      await prisma.user.deleteMany({ where: { clerkId: id } });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }
}
