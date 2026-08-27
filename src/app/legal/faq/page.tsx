import type { Metadata } from "next";
import Link from "next/link";
import { FAQPageJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Frequently Asked Questions: BingeWise",
  description:
    "Get answers to common questions about BingeWise: how it works, which streaming services it supports, pricing, watchlist sharing, and more.",
  openGraph: {
    title: "FAQ: BingeWise",
    description:
      "Common questions about BingeWise personalized TV & movie recommendations.",
    url: "https://www.bingewise.net/legal/faq",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://www.bingewise.net/legal/faq" },
};

const faqs = [
  {
    question: "What is BingeWise?",
    answer:
      "BingeWise is a free personalized TV show and movie recommendation platform. It learns your viewing preferences and serves a curated feed of content worth watching across all your streaming services. Unlike traditional recommendation engines, BingeWise combines AI-powered taste profiling with community insights from fans with similar preferences.",
  },
  {
    question: "Is BingeWise free?",
    answer:
      "Yes, BingeWise is completely free to use. Create an account, build watchlists, and get personalized recommendations at no cost. There are no premium tiers or hidden fees.",
  },
  {
    question: "How does BingeWise find shows for me?",
    answer:
      "BingeWise uses machine learning to analyze your viewing preferences based on the shows you like, save, and add to watchlists. It combines this with community data from users with similar taste to surface recommendations you'll actually enjoy. The more you use it, the better it gets.",
  },
  {
    question: "Which streaming services does BingeWise support?",
    answer:
      "BingeWise supports Netflix, Hulu, Disney+, HBO Max, Amazon Prime Video, Apple TV+, Peacock, Paramount+, Crunchyroll, and many more. Streaming availability is region-specific and covers 139 countries. You can select your subscriptions during onboarding or in Settings.",
  },
  {
    question: "Can I share my watchlists with friends?",
    answer:
      "Yes. You can share watchlists via a secret link or by sending a notification to other BingeWise users. Friends can clone your watchlist to their own collection with one tap. Private accounts restrict who can see your lists.",
  },
  {
    question: "Is BingeWise available as a mobile app?",
    answer:
      "Yes, BingeWise is available on both Android and iOS. Search 'BingeWise' in your app store. The mobile app offers the same features as the web version, including offline watchlist access.",
  },
  {
    question: "How is BingeWise different from JustWatch?",
    answer:
      "JustWatch focuses primarily on streaming availability: telling you where to watch a specific title. BingeWise goes further by learning your preferences and proactively recommending new content you haven't discovered yet. Both tools are complementary: use JustWatch to find where to watch, and BingeWise to decide what to watch next.",
  },
  {
    question: "How is BingeWise different from IMDb?",
    answer:
      "IMDb is an encyclopedia of film and TV data. BingeWise is a recommendation engine that learns your personal taste. While IMDb tells you what others think, BingeWise tells you what you'll think based on your unique preferences.",
  },
  {
    question: "Can I track shows across multiple streaming services?",
    answer:
      "Yes. BingeWise lets you select all the streaming services you subscribe to, then shows you which service has each recommended title. Your watchlists track availability across all your services so you always know where to watch.",
  },
  {
    question: "Does BingeWise work in my country?",
    answer:
      "BingeWise supports 139 countries with region-specific streaming availability. During onboarding, you select your country and preferred languages. The recommendation engine and streaming data adapt to your region.",
  },
];

export default function FAQPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-8 bg-background text-foreground text-base leading-relaxed">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to BingeWise
      </Link>

      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>

      <FAQPageJsonLd faqs={faqs} />

      <dl className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="text-lg font-semibold">{faq.question}</dt>
            <dd className="mt-1 text-muted-foreground">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
