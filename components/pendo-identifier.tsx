"use client";

import { useEffect, useRef } from "react";

type PendoUser = {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function PendoIdentifier({ user }: { user: PendoUser | null }) {
  const lastIdentifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.id === lastIdentifiedId.current) return;
    lastIdentifiedId.current = user.id;

    pendo.identify({
      visitor: {
        id: user.id,
        email: user.email || undefined,
        full_name: user.name || undefined,
        clerkId: user.clerkId,
        profileImageUrl: user.profileImageUrl || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }, [user]);

  return null;
}
