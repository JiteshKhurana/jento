"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        // Check for updates every time the page regains focus
        const checkForUpdate = () => registration.update().catch(() => {});
        window.addEventListener("focus", checkForUpdate);
        return () => window.removeEventListener("focus", checkForUpdate);
      })
      .catch(() => {
        // SW registration failure is non-fatal
      });
  }, []);

  return null;
}
