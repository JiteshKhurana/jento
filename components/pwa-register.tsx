"use client";

import { useEffect } from "react";

async function clearDevServiceWorkerState() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Dev HMR serves new chunks constantly; a registered SW causes stale
    // module errors (e.g. lucide-react "module factory is not available").
    if (process.env.NODE_ENV === "development") {
      void clearDevServiceWorkerState();
      return;
    }

    const controller = new AbortController();

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        const checkForUpdate = () => registration.update().catch(() => {});
        window.addEventListener("focus", checkForUpdate, {
          signal: controller.signal,
        });
      })
      .catch(() => {
        // SW registration failure is non-fatal
      });

    return () => controller.abort();
  }, []);

  return null;
}
