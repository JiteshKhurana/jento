"use client";

import { useEffect, useState } from "react";
import { X, Share, ArrowDownToLine } from "lucide-react";

// BeforeInstallPromptEvent is not in the standard TypeScript lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
// Don't re-show the banner for 7 days after the user dismisses it
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS] = useState(
    () =>
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window)
  );
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already running as installed PWA — never show the banner
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    if (inStandalone) return;

    // Respect previous dismissal
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts && Date.now() - Number(ts) < DISMISS_TTL_MS) return;
    } catch {
      // localStorage may be unavailable in some private-browsing contexts
    }

    if (isIOS) {
      // On iOS Safari there is no beforeinstallprompt — just show instructions
      const timer = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome / Edge: capture the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShow(true), 4000);
      // Store cleanup so we can cancel if the component unmounts before it fires
      (handler as { _timer?: ReturnType<typeof setTimeout> })._timer = timer;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      const t = (handler as { _timer?: ReturnType<typeof setTimeout> })._timer;
      if (t !== undefined) clearTimeout(t);
    };
  }, [isIOS]);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-fade-up">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Jento"
            width={40}
            height={40}
            className="shrink-0 w-10 h-10 rounded-xl"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">
              Install Jento
            </p>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Tap{" "}
                <Share
                  className="inline-block w-3 h-3 align-text-bottom"
                  aria-label="Share"
                />{" "}
                then &ldquo;Add to Home Screen&rdquo;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Add to your home screen for the best experience
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Install button — only shown on Android/Chrome when we have the deferred prompt */}
        {!isIOS && prompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-foreground text-primary-foreground text-sm font-medium py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
