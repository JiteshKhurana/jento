import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Jento",
  description: "Terms of Service for Jento, the AI-powered travel planning service.",
};

const LAST_UPDATED = "June 23, 2026";

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the Jento website, applications, and related services
        (collectively, the &quot;Service&quot;). By accessing or using the
        Service, you agree to these Terms. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Jento provides AI-assisted travel planning tools, including itinerary
        generation, destination exploration, maps, saved places, and related
        features. The Service is intended to help you plan trips; it does not
        book travel on your behalf unless a specific booking feature is
        explicitly offered and accepted by you.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <p>
        You must be at least 13 years old to use the Service. If you are under
        the age of majority where you live, you may use the Service only with
        permission from a parent or legal guardian. You are responsible for
        maintaining the confidentiality of your account credentials and for all
        activity that occurs under your account.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for any unlawful purpose or in violation of any applicable law;</li>
        <li>attempt to gain unauthorized access to the Service, other accounts, or our systems;</li>
        <li>interfere with or disrupt the Service, including by scraping, reverse engineering, or overloading our infrastructure;</li>
        <li>use the Service to generate, store, or distribute harmful, abusive, or infringing content;</li>
        <li>misrepresent your identity or affiliation with any person or organization.</li>
      </ul>
      <p>
        We may suspend or terminate access if we reasonably believe you have
        violated these Terms or if your use poses risk to the Service or other
        users.
      </p>

      <h2>4. AI-generated content</h2>
      <p>
        Parts of the Service use artificial intelligence to generate travel
        suggestions, itineraries, and other content. AI output may be
        incomplete, inaccurate, or outdated. You are responsible for verifying
        important details such as visa requirements, safety conditions, opening
        hours, prices, and booking terms before relying on any suggestion.
      </p>
      <p>
        Jento does not guarantee that AI-generated content will meet your
        expectations or be suitable for any particular purpose.
      </p>

      <h2>5. Third-party services and links</h2>
      <p>
        The Service may display information from or link to third-party
        providers, including mapping services, place data providers, airlines,
        hotels, and booking platforms. Those third parties are not controlled by
        Jento, and we are not responsible for their content, availability,
        pricing, or policies. Your use of third-party services is governed by
        their own terms and privacy policies.
      </p>

      <h2>6. Your content</h2>
      <p>
        You may submit trip details, messages, preferences, and other content
        through the Service (&quot;User Content&quot;). You retain ownership of
        your User Content. By submitting User Content, you grant Jento a
        non-exclusive, worldwide license to host, store, process, and display
        that content solely to operate, maintain, and improve the Service.
      </p>
      <p>
        You represent that you have the rights necessary to submit your User
        Content and that it does not violate the rights of others or applicable
        law.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Service, including its software, design, branding, and underlying
        technology, is owned by Jento or its licensors and is protected by
        intellectual property laws. Except for the limited right to use the
        Service as permitted by these Terms, no rights are granted to you.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, JENTO DISCLAIMS ALL WARRANTIES,
        WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
        WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, JENTO AND ITS AFFILIATES,
        OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS
        OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF
        OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM
        ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF
        (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE
        THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (USD $100).
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Jento and its affiliates from
        any claims, damages, losses, and expenses (including reasonable legal
        fees) arising out of your use of the Service, your User Content, or your
        violation of these Terms.
      </p>

      <h2>11. Changes to the Service and Terms</h2>
      <p>
        We may modify the Service or these Terms from time to time. If we make
        material changes to these Terms, we will update the &quot;Last
        updated&quot; date above and, where appropriate, provide additional
        notice. Your continued use of the Service after changes become
        effective constitutes acceptance of the revised Terms.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate
        your access to the Service at any time, with or without notice, for any
        reason permitted by law. Sections that by their nature should survive
        termination will survive, including disclaimers, limitations of
        liability, and indemnification.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the United States and the State
        of Delaware, without regard to conflict-of-law principles, except where
        mandatory local law requires otherwise.
      </p>

      <h2>14. Contact</h2>
      <p>
        If you have questions about these Terms, please contact us through the
        support channels available in the Service.
      </p>
    </LegalPageShell>
  );
}
