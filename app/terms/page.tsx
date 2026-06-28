import type { Metadata } from "next";
import { LEGAL_LAST_UPDATED } from "@/components/legal/legal-constants";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsContent } from "@/components/legal/terms-content";

export const metadata: Metadata = {
  title: "Terms of Service — Jento",
  description: "Terms of Service for Jento, the AI-powered travel planning service.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED}>
      <TermsContent />
    </LegalPageShell>
  );
}
