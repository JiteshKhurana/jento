import type { Metadata } from "next";
import { LEGAL_LAST_UPDATED } from "@/components/legal/legal-constants";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyContent } from "@/components/legal/privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy — Jento",
  description: "Privacy Policy for Jento, the AI-powered travel planning service.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <PrivacyContent />
    </LegalPageShell>
  );
}
