"use client";

import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { FileText, Moon, Shield, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { SettingsLegalPage } from "@/components/legal/settings-legal-page";
import { TermsContent } from "@/components/legal/terms-content";
import { Button } from "@/components/ui/button";

export function SettingsPageView() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="cursor-pointer"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
            Toggle theme
          </Button>
          <SignOutButton>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      <div className="flex justify-center">
        <UserProfile routing="path" path="/settings">
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
              <PrivacyContent termsHref="/settings/terms" />
            </SettingsLegalPage>
          </UserProfile.Page>
        </UserProfile>
      </div>
    </main>
  );
}
