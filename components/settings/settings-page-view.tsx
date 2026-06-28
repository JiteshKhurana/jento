"use client";

import { useClerk, UserProfile } from "@clerk/nextjs";
import { FileText, LogOut, Moon, Shield, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { SettingsLegalPage } from "@/components/legal/settings-legal-page";
import { TermsContent } from "@/components/legal/terms-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const mobileProfileActionClassName =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent";

const mobileProfileDangerActionClassName =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50";

function MobileProfileActions() {
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const themeLabel =
    mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode";

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutDialogOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex w-full gap-2">
        <button
          type="button"
          className={mobileProfileActionClassName}
          onClick={toggleTheme}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="size-5 shrink-0" />
          ) : (
            <Moon className="size-5 shrink-0" />
          )}
          {themeLabel}
        </button>
        <button
          type="button"
          className={cn(mobileProfileDangerActionClassName, "cursor-pointer")}
          onClick={() => setSignOutDialogOpen(true)}
        >
          <LogOut className="size-5 shrink-0" />
          Log Out
        </button>
      </div>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent
          showClose={false}
          className="max-w-sm gap-0 rounded-3xl p-8 sm:max-w-sm"
        >
          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-xl font-semibold leading-snug">
              Log out?
            </DialogTitle>
            <DialogDescription className="text-left text-neutral-500">
              You will need to sign in again to access your trips and saved
              places.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 cursor-pointer rounded-full"
              onClick={() => setSignOutDialogOpen(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 flex-1 cursor-pointer rounded-full"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Logging out…
                </>
              ) : (
                "Yes, log out"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SettingsPageView() {
  const isMobile = useIsMobile();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-8 md:py-14">
      <div className="flex w-full flex-col items-center">
        {isMobile && <MobileProfileActions />}
        <div className="w-full">
          <UserProfile routing="path" path="/profile">
            <UserProfile.Page
              label="Terms of Service"
              url="terms"
              labelIcon={<FileText className="h-4 w-4" />}
            >
              <SettingsLegalPage title="Terms of Service">
                <TermsContent />
              </SettingsLegalPage>
            </UserProfile.Page>
            <UserProfile.Page
              label="Privacy Policy"
              url="privacy"
              labelIcon={<Shield className="h-4 w-4" />}
            >
              <SettingsLegalPage title="Privacy Policy">
                <PrivacyContent termsHref="/profile/terms" />
              </SettingsLegalPage>
            </UserProfile.Page>
          </UserProfile>
        </div>
      </div>
    </main>
  );
}
