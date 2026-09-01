import type { Metadata } from "next";
import Link from "next/link";
import {
  Home as HomeIcon,
  Compass,
  Search,
  Users,
  Bookmark,
} from "lucide-react";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  FAQPageJsonLd,
} from "@/components/seo/JsonLd";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = {
  title:
    "BingeWise: Find Your Next Binge | Personalized TV & Movie Recommendations",
    description:
      "Discover your next favorite TV show and movie. BingeWise learns what you love and serves personalized recommendations across all your streaming services.",
  openGraph: {
    title: "BingeWise: Find Your Next Binge",
    description:
      "Discover your next favorite TV show and movie. BingeWise learns what you love and serves personalized recommendations across all your streaming services.",
    url: "https://www.bingewise.net",
    siteName: "BingeWise",
    images: [
      {
        url: "https://www.bingewise.net/images/bingewise_appicon.png",
        width: 512,
        height: 512,
        alt: "BingeWise",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BingeWise: Find Your Next Binge",
    description:
      "Discover your next favorite TV show and movie. Personalized recommendations across all your streaming services.",
    images: ["https://www.bingewise.net/images/bingewise_appicon.png"],
  },
  alternates: {
    canonical: "https://www.bingewise.net",
  },
};

const faqs = [
  {
    question: "What is BingeWise?",
    answer:
      "BingeWise helps you figure out what to watch next. It picks up on your taste over time and gives you recommendations that actually match what you like, pulling from all the streaming services you subscribe to.",
  },
  {
    question: "Is BingeWise free?",
    answer:
      "Yep, completely free. Sign up, build watchlists, follow other users, and get recommendations, no credit card, no subscriptions, no catch.",
  },
  {
    question: "How does BingeWise find shows for me?",
    answer:
      "You tell it what you like: genres, ratings, titles you have already watched. It also picks up on what you add to watchlists and what you browse. Over time it builds a profile of your taste and surfaces titles across your connected streaming services that fit.",
  },
  {
    question: "Which streaming services does BingeWise support?",
    answer:
      "It works with Netflix, Hulu, Disney+, HBO Max, Amazon Prime Video, Apple TV+, and more. You can see availability info right in the app so you know exactly where to watch.",
  },
  {
    question: "Can I share my watchlist with friends?",
    answer:
      "For sure. You can follow other users, see what they are watching, and share your own lists. You can also make public watchlists that anyone can browse and save.",
  },
];

const guestLinks = [
  { href: "/feed", label: "Feed", icon: HomeIcon, description: "See what's trending" },
  { href: "/explore", label: "Explore", icon: Compass, description: "Discover new titles" },
  { href: "/search", label: "Search", icon: Search, description: "Find any show or movie" },
  { href: "/watchlists", label: "Watchlists", icon: Bookmark, description: "Browse public lists" },
  { href: "/following", label: "Following", icon: Users, description: "See what others watch" },
];

export default function Home() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <FAQPageJsonLd faqs={faqs} />

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(to bottom, var(--hero-from), var(--hero-via), var(--background))` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: "var(--hero-blob-primary)" }} />
          <div className="absolute -top-10 right-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: "var(--hero-blob-secondary)" }} />
          <div className="absolute -top-10 left-0 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: "var(--hero-blob-secondary)" }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
            <div className="flex justify-center mb-6">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Find Your Next Binge
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              BingeWise learns what you love and recommends TV shows and movies
              across every streaming service you use. Tell us your taste, and we
              will surface hidden gems, trending picks, and classics, all
              tailored to you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="btn-primary h-12 px-8 text-sm font-semibold"
              >
                Create Account
              </Link>
              <Link
                href="/auth/login"
                className="btn-outline h-12 px-8 text-sm font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/feed"
                className="btn-ghost h-12 px-8 text-sm font-semibold text-muted-foreground"
              >
                Continue as Guest
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-px bg-border" />
        </div>

        {/* Guest Mode Links: warm orange, high contrast after blue hero */}
        <section style={{ backgroundColor: "var(--section-guest)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--secondary)" }}>
                No account required
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Explore as Guest
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Look around and see what the app is all about.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {guestLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="card p-4 flex flex-col items-center text-center gap-3 hover:border-primary/40 hover:bg-accent/50 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: "color-mix(in srgb, var(--secondary) 15%, transparent)" }}>
                      <Icon className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{link.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {link.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-px bg-border" />
        </div>

        {/* Social Proof / Trust */}
        <section style={{ backgroundColor: "var(--section-trust)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <div className="relative card overflow-hidden p-8 sm:p-10 text-center space-y-4">
              <h2 className="relative text-2xl sm:text-3xl font-bold tracking-tight">
                Built for Binge-Watchers
              </h2>
              <p className="relative text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Into edge-of-your-seat thrillers? Cozy comedies? Deep-dive
                documentaries? BingeWise picks up on what you like and keeps
                your next obsession queued up.
              </p>
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/auth/register"
                  className="btn-primary h-12 px-8 text-sm font-semibold"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/explore"
                  className="btn-outline h-12 px-8 text-sm font-semibold"
                >
                  Explore Titles
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-px bg-border" />
        </div>

        {/* FAQ */}
        <section style={{ backgroundColor: "var(--section-faq)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center" style={{ color: "var(--genre-horror)" }}>
              Frequently Asked Questions
            </h2>
            <dl className="mt-10 divide-y divide-border">
              {faqs.map((faq) => (
                <div key={faq.question} className="py-6 first:pt-0 last:pb-0">
                  <dt className="text-base font-semibold">{faq.question}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(to top, var(--cta-from), var(--cta-via), var(--background))` }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: "var(--hero-blob-secondary)" }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to start bingeing?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Sign up for free and let BingeWise find your next favorite show.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="btn-primary h-12 px-8 text-sm font-semibold"
              >
                Create Account
              </Link>
              <Link
                href="/feed"
                className="btn-ghost h-12 px-8 text-sm font-semibold text-muted-foreground"
              >
                Try as Guest
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
