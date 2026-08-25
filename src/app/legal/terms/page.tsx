import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — BingeWise",
  robots: { index: true, follow: true },
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing or using BingeWise (&quot;Service&quot;), you agree to be bound by these
        Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not
        use the Service. These Terms apply to all users of the Service worldwide.
      </p>
    ),
  },
  {
    title: "2. Eligibility and Age Requirement",
    body: (
      <>
        <p>
          You must be at least <strong>13 years of age</strong> to use the Service. In
          jurisdictions where the minimum age for data processing consent is higher (for
          example, 16 in certain European Union member states), you must meet that higher
          age requirement. By creating an account, you represent and warrant that you meet
          the applicable minimum age in your country.
        </p>
        <p>
          If you are under the applicable minimum age, you must not use the Service. We
          reserve the right to terminate accounts where we have reason to believe the user
          does not meet the age requirement.
        </p>
      </>
    ),
  },
  {
    title: "3. Description of Service",
    body: (
      <>
        <p>
          The Service — available through our website and our mobile application
          (collectively, the &quot;Service&quot;) — provides personalized movie and TV show
          recommendations based on your preferences, streaming service subscriptions, and
          viewing history. Features include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Personalized content recommendations</li>
          <li>Trailer viewing and discovery</li>
          <li>Social features including following users and sharing recommendations</li>
          <li>Watchlists you can keep private or publish for others to discover</li>
          <li>Comments and interactions on content</li>
          <li>Notifications for new releases and recommendations</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. User Accounts",
    body: (
      <>
        <p>To use certain features of the Service, you must create an account. You agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain the security of your password and account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Accept responsibility for all activities that occur under your account</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. User Content",
    body: (
      <>
        <p>
          You retain ownership of content you post, but grant us a worldwide, non-exclusive,
          royalty-free license to use, modify, and display that content in connection with
          the Service. You agree not to post content that:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Is illegal, harmful, threatening, abusive, or harassing</li>
          <li>Infringes on intellectual property rights</li>
          <li>Contains spam or commercial solicitations</li>
          <li>Violates any applicable laws or regulations</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Prohibited Conduct",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to the Service or its systems</li>
          <li>Interfere with or disrupt the Service&apos;s functionality</li>
          <li>Create multiple accounts or impersonate others</li>
          <li>Scrape, collect, or harvest user data</li>
          <li>Use the Service if you do not meet the minimum age requirement</li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Third-Party Content and Services",
    body: (
      <p>
        The Service may display content from third-party sources, including TMDB (The Movie
        Database) and JustWatch. We are not responsible for the accuracy or availability of
        third-party content. Streaming availability information is provided for
        informational purposes only and may vary by region.
      </p>
    ),
  },
  {
    title: "8. Advertising",
    body: (
      <>
        <p>
          The Service may display advertisements provided by third-party advertising
          networks, including Google AdSense on our website and Google AdMob in our mobile
          application.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Website:</strong> Where required by law, we request your consent via the
            cookie banner shown on your first visit; continuing to use the website after
            being presented with the banner constitutes consent to advertising cookies. You
            can change your choice at any time by clearing this site&apos;s cookies and
            reloading.
          </li>
          <li>
            <strong>Mobile application (iOS):</strong> With your permission, we use the
            device advertising identifier to show personalized ads. Permission is requested
            via the App Tracking Transparency prompt; denying it results in
            non-personalized ads only.
          </li>
          <li>
            <strong>Mobile application (Android):</strong> Ads are served based on your
            Google advertising settings; you may opt out of ads personalization in{" "}
            <em>Settings &rarr; Google &rarr; Ads</em>.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "9. Intellectual Property",
    body: (
      <p>
        The Service and its original content, features, and functionality are owned by
        BingeWise and are protected by international copyright, trademark, and other
        intellectual property laws. Content from TMDB and JustWatch remains the property of
        their respective owners.
      </p>
    ),
  },
  {
    title: "10. Termination",
    body: (
      <p>
        We may terminate or suspend your account immediately, without prior notice, for
        conduct that we believe violates these Terms or is harmful to other users, us, or
        third parties. You may also delete your account at any time through{" "}
        <strong>Settings &rarr; Account &rarr; Delete Account</strong>.
      </p>
    ),
  },
  {
    title: "11. Disclaimer of Warranties",
    body: (
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind, either
        express or implied. We do not guarantee that the Service will be uninterrupted,
        secure, or error-free. Content recommendations are generated algorithmically and we
        make no guarantees about their accuracy or suitability.
      </p>
    ),
  },
  {
    title: "12. Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by applicable law, we shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages resulting from
        your use of the Service. In jurisdictions that do not allow the exclusion of certain
        warranties or limitation of liability, our liability is limited to the maximum
        extent permitted by law.
      </p>
    ),
  },
  {
    title: "13. Changes to Terms",
    body: (
      <p>
        We reserve the right to modify these Terms at any time. We will notify users of
        significant changes through the Service or by email. Your continued use after
        changes constitutes acceptance of the modified Terms. If you do not agree to the
        updated Terms, you must stop using the Service.
      </p>
    ),
  },
  {
    title: "14. Governing Law",
    body: (
      <p>
        These Terms are governed by and construed in accordance with the laws of the United
        States, without regard to conflict of law principles. Users in other jurisdictions
        may also have rights under local mandatory laws that these Terms do not override.
      </p>
    ),
  },
  {
    title: "15. Contact Us",
    body: (
      <p>
        If you have questions about these Terms, please contact us at{" "}
        <a className="underline" href="mailto:support@api-bingewise.com">
          support@api-bingewise.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last Updated: July 2026</p>

      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.body}
        </section>
      ))}
    </article>
  );
}
