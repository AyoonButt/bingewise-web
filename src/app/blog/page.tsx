import type { Metadata } from "next";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

export const metadata: Metadata = {
  title: "Blog — BingeWise",
  description:
    "Read movie and TV show recommendations, streaming tips, and watchlist ideas from the BingeWise team. Discover what to watch next with expert picks and editorial coverage.",
  openGraph: {
    title: "BingeWise Blog",
    description:
      "Read movie and TV show recommendations, streaming tips, and watchlist ideas from the BingeWise team.",
    url: "https://www.bingewise.net/blog",
    siteName: "BingeWise",
    type: "website",
    images: [
      {
        url: "https://www.bingewise.net/api/og/static/blog",
        width: 1200,
        height: 630,
        alt: "BingeWise Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.bingewise.net/api/og/static/blog"],
  },
  alternates: { canonical: "https://www.bingewise.net/blog" },
};

const posts = [
  {
    slug: "best-movies-2026",
    title: "The Best Movies to Watch in 2026",
    excerpt:
      "From sci-fi epics to intimate dramas, here are the most anticipated films of 2026 and how to plan your watchlist before they hit streaming platforms.",
    date: "2026-01-15",
    readTime: "5 min read",
    image: "https://www.bingewise.net/api/og/static/blog-best-movies-2026",
  },
  {
    slug: "building-the-perfect-watchlist",
    title: "How to Build the Perfect Watchlist",
    excerpt:
      "Stop endlessly scrolling and start curating. Learn the framework BingeWise uses to organize recommendations by mood, genre, and viewing occasion.",
    date: "2026-01-10",
    readTime: "4 min read",
    image: "https://www.bingewise.net/api/og/static/blog-watchlist-guide",
  },
  {
    slug: "streaming-fatigue-solutions",
    title: "Beat Streaming Fatigue with Smarter Recommendations",
    excerpt:
      "With dozens of services and thousands of titles, choosing what to watch can feel impossible. Here is how AI-powered taste profiling cuts through the noise.",
    date: "2025-12-28",
    readTime: "6 min read",
    image: "https://www.bingewise.net/api/og/static/blog-streaming-fatigue",
  },
  {
    slug: "hidden-gems-on-netflix",
    title: "Hidden Gems on Netflix You Missed Last Month",
    excerpt:
      "The algorithm pushes you toward the obvious. These under-the-radar titles are what BingeWise users are quietly adding to their watchlists right now.",
    date: "2025-12-20",
    readTime: "4 min read",
    image: "https://www.bingewise.net/api/og/static/blog-hidden-gems",
  },
  {
    slug: "tv-series-to-binge-this-year",
    title: "TV Series Worth Binge-Watching This Year",
    excerpt:
      "From comeback seasons of fan favorites to debut series generating buzz, these are the shows that dominated conversations on BingeWise this winter.",
    date: "2025-12-15",
    readTime: "5 min read",
    image: "https://www.bingewise.net/api/og/static/blog-tv-series",
  },
];

export default function BlogPage() {
  return (
    <section aria-label="BingeWise Blog" className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          BingeWise Blog
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Movie picks, streaming advice, and watchlist strategies from the
          team behind BingeWise. Updated regularly to help you figure out
          what to watch next.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>

      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          More articles coming soon. Follow us on Instagram and TikTok for
          daily recommendations.
        </p>
      </div>
    </section>
  );
}
