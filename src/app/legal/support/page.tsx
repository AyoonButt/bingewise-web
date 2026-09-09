import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Support: BingeWise",
  description:
    "Get help with BingeWise. Contact our support team, check common issues, and find answers to account, recommendation, and streaming questions.",
  openGraph: {
    title: "Support: BingeWise",
    description:
      "Get help with your BingeWise account, recommendations, and streaming questions.",
    url: "https://www.bingewise.net/legal/support",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://www.bingewise.net/legal/support" },
};

const commonIssues = [
  {
    title: "Not seeing recommendations",
    description:
      "Make sure you've completed onboarding and rated a few shows. The more you rate, like, and add to watchlists, the better your personalized feed becomes.",
  },
  {
    title: "A streaming service is missing",
    description:
      "Streaming availability is region-specific. Check your country and subscription selections under Settings > Subscriptions to make sure everything is up to date.",
  },
  {
    title: "Watchlist sharing isn't working",
    description:
      "Watchlists can be shared via secret link or by sending a notification to other BingeWise users. Private accounts restrict who can see your lists. Check your privacy settings.",
  },
  {
    title: "Forgot my password",
    description:
      "Use the password reset option on the login screen to receive a secure reset link at the email associated with your account.",
  },
  {
    title: "Push notifications not arriving",
    description:
      "Check your notification permissions in your browser and in Settings > Notifications. Some browsers restrict web push notifications.",
  },
];

export default function SupportPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-8 bg-background text-foreground text-base leading-relaxed">
      <h1 className="text-3xl font-bold">Contact Support</h1>

      <p>
        We&apos;re here to help. If you can&apos;t find what you&apos;re looking
        for below, reach out to us and we&apos;ll get back to you as soon as
        possible.
      </p>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Reach Us</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Email:{" "}
            <a className="underline" href="mailto:support@bingewise.net">
              support@bingewise.net
            </a>
          </li>
          <li>
            Twitter:{" "}
            <a
              className="underline"
              href="https://twitter.com/BingeWiseApp"
              target="_blank"
              rel="noopener noreferrer"
            >
              @BingeWiseApp
            </a>
          </li>
        </ul>
        <p>
          When emailing, please include your account&apos;s registered email address
          and a detailed description of the issue so we can help you faster.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Common Issues</h2>
        <ul className="space-y-4">
          {commonIssues.map((issue) => (
            <li key={issue.title}>
              <h3 className="text-lg font-semibold">{issue.title}</h3>
              <p className="mt-1 text-muted-foreground">{issue.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Related Resources</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <Link href="/legal/faq" className="underline">
              Frequently Asked Questions
            </Link>
          </li>
          <li>
            <Link href="/legal/about" className="underline">
              About BingeWise
            </Link>
          </li>
          <li>
            <Link href="/legal/privacy" className="underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/legal/terms" className="underline">
              Terms of Service
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
