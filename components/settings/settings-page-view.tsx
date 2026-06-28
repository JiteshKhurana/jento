"use client";

import { UserProfile } from "@clerk/nextjs";
import { FileText, Shield } from "lucide-react";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { SettingsLegalPage } from "@/components/legal/settings-legal-page";
import { TermsContent } from "@/components/legal/terms-content";

export function SettingsPageView() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-8 md:py-14">
      <div className="flex justify-center">
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
    </main>
  );
}
