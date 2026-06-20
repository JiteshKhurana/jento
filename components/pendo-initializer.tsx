"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

export function PendoInitializer() {
  const initialized = useRef(false);
  const { isSignedIn, isLoaded } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    pendo.initialize({ visitor: { id: "" } });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (wasSignedIn.current && isSignedIn === false) {
      pendo.clearSession();
    }
    wasSignedIn.current = !!isSignedIn;
  }, [isSignedIn, isLoaded]);

  return null;
}
