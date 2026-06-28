import Link from "next/link";

type PrivacyContentProps = {
  termsHref?: string;
};

export function PrivacyContent({ termsHref = "/terms" }: PrivacyContentProps) {
  return (
    <>
      <p>
        This Privacy Policy explains how Jento (&quot;Jento,&quot;
        &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and
        shares information when you use our website, applications, and related
        services (collectively, the &quot;Service&quot;).
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you provide</h3>
      <p>When you use the Service, you may provide:</p>
      <ul>
        <li>account information, such as your name, email address, and profile image, when you sign up or sign in;</li>
        <li>trip information, including destinations, dates, preferences, itineraries, saved places, and chat messages;</li>
        <li>other content you choose to submit through the Service.</li>
      </ul>

      <h3>Information collected automatically</h3>
      <p>When you use the Service, we may automatically collect:</p>
      <ul>
        <li>device and browser information, such as IP address, browser type, operating system, and device identifiers;</li>
        <li>usage information, such as pages viewed, features used, clicks, and interaction patterns;</li>
        <li>log and diagnostic data related to performance, errors, and security.</li>
      </ul>

      <h3>Information from third parties</h3>
      <p>
        If you sign in through an authentication provider, we receive account
        information from that provider according to your settings with them. We
        may also receive place, map, and travel-related data from third-party
        data providers when you use features that rely on those services.
      </p>

      <h2>2. How we use information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>provide, operate, and maintain the Service;</li>
        <li>create and manage your account and trips;</li>
        <li>generate AI-assisted travel suggestions and itineraries;</li>
        <li>improve, personalize, and develop the Service;</li>
        <li>monitor usage, troubleshoot issues, and protect against fraud or abuse;</li>
        <li>communicate with you about the Service, including support and important updates;</li>
        <li>comply with legal obligations and enforce our terms and policies.</li>
      </ul>

      <h2>3. AI processing</h2>
      <p>
        To power chat, itinerary generation, and related features, we may send
        relevant portions of your trip details and messages to AI service
        providers for processing. We use this information to generate responses
        and suggestions for your account. Do not submit sensitive personal
        information you do not want processed for this purpose.
      </p>

      <h2>4. How we share information</h2>
      <p>We may share information in the following circumstances:</p>
      <ul>
        <li>
          <strong>Service providers:</strong> with vendors that help us operate
          the Service, such as hosting, authentication, analytics, mapping, and
          AI providers, subject to appropriate contractual protections;
        </li>
        <li>
          <strong>Third-party integrations:</strong> when you use features that
          rely on external services, such as maps or place data;
        </li>
        <li>
          <strong>Legal and safety:</strong> when required by law, legal process,
          or governmental request, or when we believe disclosure is necessary to
          protect rights, safety, and security;
        </li>
        <li>
          <strong>Business transfers:</strong> in connection with a merger,
          acquisition, financing, reorganization, or sale of assets;
        </li>
        <li>
          <strong>With your direction:</strong> when you ask us to share
          information or otherwise consent.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We and our service providers may use cookies, local storage, and
        similar technologies to keep you signed in, remember preferences,
        understand how the Service is used, and improve performance. You can
        control cookies through your browser settings, but some features may not
        function properly if certain cookies are disabled.
      </p>

      <h2>6. Analytics</h2>
      <p>
        We use product analytics tools to understand how users interact with
        the Service. These tools may collect usage data and associate it with an
        account or device identifier. When you are signed in, analytics data may
        be linked to your account to help us improve the product experience.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We retain information for as long as necessary to provide the Service,
        comply with legal obligations, resolve disputes, and enforce our
        agreements. Retention periods may vary depending on the type of data and
        how it is used.
      </p>

      <h2>8. Security</h2>
      <p>
        We use administrative, technical, and organizational measures designed to
        protect information against unauthorized access, loss, misuse, or
        alteration. No method of transmission or storage is completely secure,
        and we cannot guarantee absolute security.
      </p>

      <h2>9. Your choices and rights</h2>
      <p>Depending on where you live, you may have rights to:</p>
      <ul>
        <li>access, correct, or delete certain personal information;</li>
        <li>object to or restrict certain processing;</li>
        <li>withdraw consent where processing is based on consent;</li>
        <li>request a copy of your information in a portable format.</li>
      </ul>
      <p>
        You can update some account information through your account settings.
        To make a privacy request, contact us through the support channels
        available in the Service. We may need to verify your identity before
        responding.
      </p>

      <h2>10. Children&apos;s privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly
        collect personal information from children under 13. If you believe a
        child has provided us personal information, please contact us so we can
        take appropriate action.
      </p>

      <h2>11. International users</h2>
      <p>
        If you access the Service from outside the United States, your
        information may be processed in the United States or other countries
        where we or our service providers operate. Those countries may have data
        protection laws that differ from the laws where you live.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make material
        changes, we will update the &quot;Last updated&quot; date above and,
        where appropriate, provide additional notice. Your continued use of the
        Service after changes become effective means you accept the revised
        policy.
      </p>

      <h2>13. Contact us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices,
        please contact us through the support channels available in the Service.
        You can also review our{" "}
        <Link href={termsHref}>Terms of Service</Link>.
      </p>
    </>
  );
}
