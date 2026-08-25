import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — BingeWise",
  robots: { index: true, follow: true },
};

const SUPPORT_EMAIL = "support@api-bingewise.com";

function EmailLink() {
  return (
    <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
      {SUPPORT_EMAIL}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last Updated: July 2026</p>

      <p>
        Your privacy is important to us. This Privacy Policy explains how BingeWise
        (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and
        safeguards your information when you use our website and our mobile application
        (collectively, the &quot;Service&quot;). By using the Service, you agree to the
        practices described in this policy.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Age Requirement</h2>
        <p>
          The Service is intended for users who are{" "}
          <strong>13 years of age or older</strong>. In certain jurisdictions the minimum
          age may be higher (for example, 16 in some European Union member states under GDPR
          Article 8). By creating an account, you confirm that you meet the minimum age
          requirement in your country.
        </p>
        <p>
          We do not knowingly collect personal information from anyone below the applicable
          minimum age. If we learn that we have collected information from a user who does
          not meet the age requirement, we will delete that information promptly. If you
          believe a minor has provided us with personal information, please contact us at{" "}
          <EmailLink />.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Information We Collect</h2>
        <h3 className="text-base font-medium mt-3">2.1 Information You Provide</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Information:</strong> Name, username, email address, and
            password when you register
          </li>
          <li>
            <strong>Preferences:</strong> Language, region, streaming service subscriptions,
            and genre preferences
          </li>
          <li>
            <strong>User Content:</strong> Comments, reviews, watchlists, and interactions
            you post
          </li>
          <li>
            <strong>Communications:</strong> Information you provide when contacting support
          </li>
        </ul>
        <h3 className="text-base font-medium mt-3">
          2.2 Information Collected Automatically
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Usage Data:</strong> How you interact with the Service, including
            content viewed, features used, and time spent
          </li>
          <li>
            <strong>Cookies (Website):</strong> Authentication cookies and, where
            applicable, advertising cookies (see Sections 6 and 7)
          </li>
          <li>
            <strong>Log Data:</strong> IP address, browser or device type, and pages or
            screens viewed for security and analytics purposes
          </li>
          <li>
            <strong>Advertising Identifier (Mobile):</strong> On mobile devices, with your
            permission (via the App Tracking Transparency prompt on iOS), we collect your
            device&apos;s advertising identifier to show personalized advertisements
            through Google AdMob. You may deny this permission, in which case only
            non-personalized ads will be shown.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide personalized content recommendations</li>
          <li>Create and manage your account</li>
          <li>Enable social features like following and sharing</li>
          <li>Show advertisements, including personalized ads where you have given consent</li>
          <li>Improve and optimize the Service</li>
          <li>Respond to your inquiries and provide support</li>
          <li>Ensure the security and integrity of the Service</li>
          <li>Comply with applicable legal obligations</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Information Sharing</h2>
        <p>We may share your information in the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>With Other Users:</strong> Your public profile, username, and public
            interactions are visible to other users
          </li>
          <li>
            <strong>Service Providers:</strong> Third-party vendors who assist in operating
            the Service (hosting, analytics, notifications, advertising)
          </li>
          <li>
            <strong>Advertising Partners:</strong> With your consent, advertising cookies
            may be shared with Google AdSense to serve personalized ads
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law or to protect our
            rights
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with a merger, acquisition,
            or sale of assets
          </li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
        <p>
          The Service uses the following third-party services that may collect information
          under their own privacy policies:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>TMDB API:</strong> For movie and TV show data (
            <a
              className="underline"
              href="https://www.themoviedb.org/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Firebase (Google):</strong> For push notifications and analytics (
            <a
              className="underline"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google AdMob (mobile app):</strong> For displaying advertisements (
            <a
              className="underline"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google AdSense (website):</strong> For displaying advertisements (
            <a
              className="underline"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>JustWatch:</strong> For streaming availability data (
            <a
              className="underline"
              href="https://www.justwatch.com/us/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              JustWatch Privacy Policy
            </a>
            )
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Advertising and Tracking</h2>
        <p>
          We display advertisements through Google AdMob in our mobile application and
          Google AdSense on our website. Depending on the platform, ads may be personalized
          as follows:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Mobile (iOS):</strong> We request permission via the App Tracking
            Transparency prompt before using your advertising identifier for personalized
            ads. Change your choice anytime in <em>Settings &rarr; Privacy &amp;
            Security &rarr; Tracking</em>.
          </li>
          <li>
            <strong>Mobile (Android):</strong> Ads respect your Google advertising
            settings. Opt out of personalization in{" "}
            <em>Settings &rarr; Google &rarr; Ads</em>, or delete your advertising ID.
          </li>
          <li>
            <strong>Website:</strong> With your consent via our cookie banner, AdSense may
            use advertising cookies to serve personalized ads. Continuing to browse after
            being shown the banner constitutes consent; you can withdraw it at any time by
            clearing this site&apos;s cookies and reloading, or via{" "}
            <a
              className="underline"
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            .
          </li>
        </ul>
        <p>
          If you opt out, you will still see ads, but they will not be personalized based on
          your interests.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Cookies and Device Identifiers</h2>
        <p>The Service uses the following categories of tracking technologies:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Strictly Necessary (Website):</strong> Authentication session cookies
            required for sign-in and security. These cannot be disabled.
          </li>
          <li>
            <strong>Advertising:</strong> Cookies on the website and advertising
            identifiers on mobile, used to serve ads (personalization subject to the
            choices described in Section 6).
          </li>
          <li>
            <strong>Analytics (optional):</strong> Used to understand feature usage so we
            can improve the Service. You may disable analytics when prompted, where
            presented with a choice.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your
          personal information, including:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Encryption of sensitive data in transit and at rest</li>
          <li>Secure authentication using JWT tokens</li>
          <li>Regular security assessments</li>
          <li>Access controls limiting who can view your data</li>
        </ul>
        <p>
          No method of transmission over the Internet or electronic storage is 100% secure.
          While we strive to protect your data, we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          9. Your Rights — EEA and UK (GDPR / UK GDPR)
        </h2>
        <p>
          If you are located in the European Economic Area (EEA) or the United Kingdom, you
          have the following rights regarding your personal data:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Access:</strong> Request a copy of your personal data
          </li>
          <li>
            <strong>Rectification:</strong> Request correction of inaccurate data
          </li>
          <li>
            <strong>Erasure:</strong> Request deletion of your data (&quot;Right to be
            Forgotten&quot;)
          </li>
          <li>
            <strong>Portability:</strong> Request transfer of your data in a
            machine-readable format
          </li>
          <li>
            <strong>Restriction:</strong> Request limitation of processing
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your data for direct
            marketing or legitimate interests
          </li>
          <li>
            <strong>Withdraw Consent:</strong> Where processing is based on consent,
            withdraw it at any time without affecting prior processing
          </li>
        </ul>
        <p>
          To exercise these rights, use the settings within the Service or contact us at{" "}
          <EmailLink />. We will respond within 30 days. You also have the right to lodge a
          complaint with your local data protection authority.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          10. Your Rights — California Residents (CCPA / CPRA)
        </h2>
        <p>
          If you are a California resident, you have the following additional rights under
          the California Consumer Privacy Act (CCPA) and California Privacy Rights Act
          (CPRA):
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Know:</strong> The right to know what personal information we collect,
            use, disclose, and sell
          </li>
          <li>
            <strong>Delete:</strong> The right to request deletion of your personal
            information
          </li>
          <li>
            <strong>Correct:</strong> The right to correct inaccurate personal information
          </li>
          <li>
            <strong>Opt-Out of Sale/Sharing:</strong> We do not sell your personal
            information. We may share advertising cookies with Google for cross-context
            behavioral advertising where you have given consent; you may opt out as
            described in Section 6.
          </li>
          <li>
            <strong>Non-Discrimination:</strong> We will not discriminate against you for
            exercising any of these rights
          </li>
        </ul>
        <p>
          To exercise your California rights, contact us at <EmailLink /> with the subject
          line &quot;California Privacy Request.&quot;
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">11. Data Retention and Deletion</h2>
        <p>
          We retain your personal information for as long as your account is active or as
          needed to provide services and comply with legal obligations.
        </p>
        <p>
          <strong>To delete your account and all associated data:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>In the Service:</strong> Go to{" "}
            <strong>Settings &rarr; Account &rarr; Delete Account</strong>. Your account and
            all associated data will be permanently removed from our systems.
          </li>
          <li>
            <strong>By email:</strong> Send a deletion request to <EmailLink /> with the
            subject line &quot;Data Deletion Request.&quot; Include your registered email
            address or username. We will process your request within 30 days.
          </li>
        </ul>
        <p>
          Upon deletion, we will permanently remove your profile, posts, comments,
          preferences, and all other personal data from our systems. Some anonymised or
          aggregated data may be retained for analytics purposes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">12. International Data Transfers</h2>
        <p>
          BingeWise is operated internationally. Your information may be transferred to and
          processed in countries other than your country of residence, including countries
          that may not provide the same level of data protection as your home country. Where
          required, we rely on appropriate safeguards (such as standard contractual clauses)
          to protect your data during such transfers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">13. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes through the Service or by email. The &quot;Last
          Updated&quot; date at the top of this policy indicates when it was last revised.
          Your continued use of the Service after changes constitutes acceptance of the
          updated policy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">14. Contact Us</h2>
        <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Email: <EmailLink />
          </li>
          <li>Through the Service&apos;s feedback feature</li>
        </ul>
      </section>
    </article>
  );
}
