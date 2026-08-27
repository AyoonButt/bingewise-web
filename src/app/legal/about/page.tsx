import type { Metadata } from "next";
import Link from "next/link";
import { PersonJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "About BingeWise: Personalized TV & Movie Recommendations",
  description:
    "Learn about BingeWise, the free personalized TV show and movie recommendation platform. Discover how AI-powered taste profiling helps you find your next favorite binge across all streaming services.",
  openGraph: {
    title: "About BingeWise",
    description:
      "Free personalized TV & movie recommendations powered by AI taste profiling.",
    url: "https://bingewise.net/legal/about",
    siteName: "BingeWise",
    type: "website",
  },
  alternates: { canonical: "https://bingewise.net/legal/about" },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-8 bg-background text-foreground text-base leading-relaxed">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to BingeWise
      </Link>

      <h1 className="text-3xl font-bold">About BingeWise</h1>

      <PersonJsonLd
        name="BingeWise Team"
        url="https://bingewise.net"
        description="The team behind BingeWise, a free personalized TV and movie recommendation platform."
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p>
          BingeWise was built to solve a simple but pervasive problem: with thousands of
          shows and movies spread across a dozen streaming services, finding something
          worth watching has become a chore instead of a pleasure. We believe your free
          time is too valuable to spend scrolling past titles you&apos;ll never enjoy.
        </p>
        <p>
          Our platform learns what you actually like: not just what&apos;s trending or
          what the mainstream audience rates highly, and serves a curated feed of content
          tailored to your unique taste. Whether you love hidden indie gems, prestige
          dramas, niche anime, or blockbuster action, BingeWise finds the titles that
          match your preferences and surfaces them before you even know to search for
          them.
        </p>
        <p>
          We combine AI-powered taste profiling with insights from a community of viewers
          who share your sensibilities, so recommendations improve the more you use the
          platform. BingeWise is free, ad-supported, and available on web, Android, and
          iOS.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>Sign up</strong>: Create a free account in seconds. Tell us your
            region and which streaming services you subscribe to.
          </li>
          <li>
            <strong>Rate content</strong>: Mark shows and movies you love, like, or
            dislike. The more you interact, the smarter BingeWise becomes.
          </li>
          <li>
            <strong>Get recommendations</strong>: Your personalized feed surfaces titles
            you&apos;re genuinely going to enjoy, ranked by predicted fit.
          </li>
          <li>
            <strong>Build watchlists</strong>: Save interesting titles to watchlists. Keep
            them private or publish them for others to discover.
          </li>
          <li>
            <strong>Share with friends</strong>: Follow other users, share watchlists via
            secret links, and see what people with similar taste are watching.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Data Sources</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <a
              className="underline"
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB
            </a>{" "}
            . Movie and TV show metadata, ratings, and images provided by The Movie
            Database (TMDB). This product uses the TMDB API but is not endorsed or
            certified by TMDB.
          </li>
          <li>
            <a
              className="underline"
              href="https://www.justwatch.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              JustWatch
            </a>{" "}
            . Streaming availability data provided by JustWatch.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <ul className="list-disc pl-5 space-y-1">
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
      </section>
    </article>
  );
}
