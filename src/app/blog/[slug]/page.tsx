import { Metadata } from "next";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { ArticleJsonLd } from "@/components/seo/JsonLd";

const SITE_URL = "https://www.bingewise.net";

export async function generateStaticParams() {
  return [
    { slug: "best-movies-2026" },
    { slug: "building-the-perfect-watchlist" },
    { slug: "streaming-fatigue-solutions" },
    { slug: "hidden-gems-on-netflix" },
    { slug: "tv-series-to-binge-this-year" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slugs: Record<string, { title: string; description: string }> = {
    "best-movies-2026": {
      title: "The Best Movies to Watch in 2026 — BingeWise",
      description:
        "From sci-fi epics to intimate dramas, here are the most anticipated films of 2026 and how to plan your watchlist before they hit streaming platforms.",
    },
    "building-the-perfect-watchlist": {
      title: "How to Build the Perfect Watchlist — BingeWise",
      description:
        "Stop endlessly scrolling and start curating. Learn the framework BingeWise uses to organize recommendations by mood, genre, and viewing occasion.",
    },
    "streaming-fatigue-solutions": {
      title: "Beat Streaming Fatigue — BingeWise",
      description:
        "With dozens of services and thousands of titles, choosing what to watch can feel impossible. Here is how AI-powered taste profiling cuts through the noise.",
    },
    "hidden-gems-on-netflix": {
      title: "Hidden Gems on Netflix You Missed — BingeWise",
      description:
        "The algorithm pushes you toward the obvious. These under-the-radar titles are what BingeWise users are quietly adding to their watchlists right now.",
    },
    "tv-series-to-binge-this-year": {
      title: "TV Series Worth Binge-Watching This Year — BingeWise",
      description:
        "From comeback seasons of fan favorites to debut series generating buzz, these are the shows that dominated conversations on BingeWise this winter.",
    },
  };

  const info = slugs[params.slug];
  if (!info) {
    return { title: "Article Not Found" };
  }

  return {
    title: info.title,
    description: info.description,
    openGraph: {
      title: info.title,
      description: info.description,
      url: `https://www.bingewise.net/blog/${params.slug}`,
      siteName: "BingeWise",
      type: "article",
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `https://www.bingewise.net/blog/${params.slug}` },
  };
}

const articles: Record<
  string,
  {
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    content: string[];
  }
> = {
  "best-movies-2026": {
    title: "The Best Movies to Watch in 2026",
    excerpt:
      "From sci-fi epics to intimate dramas, here are the most anticipated films of 2026 and how to plan your watchlist before they hit streaming platforms.",
    date: "January 15, 2026",
    readTime: "5 min read",
    content: [
      "2026 is shaping up to be one of the strongest years for cinema in recent memory. With franchise blockbusters, independent darlings, and international releases expanding their streaming footprints, there is no shortage of options. The challenge is knowing where to start.",
      "BingeWise has analyzed viewing patterns, critic consensus, and user engagement data to compile a definitive list of the must-watch films of 2026. Whether you are into prestige drama, high-octane action, or quiet character studies, there is something on this list that fits your taste profile.",
      "The biggest takeaway from early 2026 releases is how many studios are embracing mid-budget original films. After years of the franchise model dominating theaters, audiences are showing they still want intimate stories with strong writing and compelling performances. BingeWise users have been particularly drawn to these titles, adding them to watchlists at rates that surprise even the recommendation team.",
      "Planning your watchlist now means you will not be overwhelmed when the major releases hit streaming platforms later this year. Add the titles that match your genre preferences and let the algorithm do the rest.",
    ],
  },
  "building-the-perfect-watchlist": {
    title: "How to Build the Perfect Watchlist",
    excerpt:
      "Stop endlessly scrolling and start curating. Learn the framework BingeWise uses to organize recommendations by mood, genre, and viewing occasion.",
    date: "January 10, 2026",
    readTime: "4 min read",
    content: [
      "A watchlist is not just a collection of titles you might watch someday. It is a curated reflection of what you actually want to see, organized by mood, occasion, and genre. The difference between a cluttered list and a useful watchlist comes down to intention.",
      "Start by separating your watchlist into categories: things you are in the mood for right now, titles you want to see eventually, and films you are saving for a specific occasion like a weekend marathon or a date night. BingeWatch supports nested lists and tags, so you can organize without friction.",
      "The secret to a great watchlist is diversity. Mixing genres, eras, and countries of origin keeps your recommendations fresh. BingeWise learns from every title you add, so even films you think you will never watch contribute to a better recommendation engine over time.",
      "Review your watchlist monthly. Remove titles that no longer interest you and add new discoveries. A living watchlist is a better watchlist than one you set and forget.",
    ],
  },
  "streaming-fatigue-solutions": {
    title: "Beat Streaming Fatigue with Smarter Recommendations",
    excerpt:
      "With dozens of services and thousands of titles, choosing what to watch can feel impossible. Here is how AI-powered taste profiling cuts through the noise.",
    date: "December 28, 2025",
    readTime: "6 min read",
    content: [
      "The paradox of streaming is that more content means harder choices. With every major platform offering thousands of titles, the average viewer spends more time browsing than watching. This is streaming fatigue, and it is getting worse.",
      "The root cause is simple: recommendation algorithms are built for engagement, not for your actual taste. They push what is popular and what keeps you scrolling, not what you will genuinely enjoy. This creates a feedback loop where you see the same titles everywhere and miss the hidden gems that match your unique preferences.",
      "BingeWise approaches this differently. Our recommendation engine builds a taste profile based on what you actually rate, save, and watch to completion — not just what you click on. By combining collaborative filtering with content-based analysis, we surface titles that fit your profile but might not appear in the top ten of any single streaming service.",
      "The result is a feed that feels personally curated rather than algorithmically generated. Users report spending less time browsing and more time watching, which is exactly the goal.",
    ],
  },
  "hidden-gems-on-netflix": {
    title: "Hidden Gems on Netflix You Missed Last Month",
    excerpt:
      "The algorithm pushes you toward the obvious. These under-the-radar titles are what BingeWise users are quietly adding to their watchlists right now.",
    date: "December 20, 2025",
    readTime: "4 min read",
    content: [
      "Netflix rotates its catalog constantly, and the algorithm's main row is designed to keep you on the platform, not necessarily to show you the best content. BingeWise users have been quietly adding these under-the-radar titles to their watchlists, and they are worth discovering.",
      "These are not the obvious recommendations that appear in the Top 10 row. They are the smaller films, international releases, and genre-specific picks that the algorithm buries but that BingeWise users have rated highly. The common thread is strong writing, compelling performances, and a freshness that mainstream algorithms often miss.",
      "If you have been feeling like Netflix has nothing new to offer, the problem is probably not the catalog. It is the way the platform surfaces content. Try searching for titles in different genres and languages — you might be surprised what is available that you have never seen.",
    ],
  },
  "tv-series-to-binge-this-year": {
    title: "TV Series Worth Binge-Watching This Year",
    excerpt:
      "From comeback seasons of fan favorites to debut series generating buzz, these are the shows that dominated conversations on BingeWise this winter.",
    date: "December 15, 2025",
    readTime: "5 min read",
    content: [
      "Television is in a golden age, but with so many series releasing every week, it is easy to miss the ones that matter. BingeWise has tracked community engagement and watch completion rates to identify the series that users are most passionate about this season.",
      "The standout trend is the resurgence of character-driven dramas. After several years of procedural and reality-dominated schedules, audiences are gravitating toward shows that prioritize deep character development and slow-burn storytelling. Series like these reward patience and create the kind of emotional investment that makes a binge worthwhile.",
      "International series continue to gain momentum. With subtitles and dubbing more accessible than ever, non-English-language shows are reaching wider audiences. BingeWise users have been particularly active in discovering and recommending foreign-language series, adding them to watchlists at record rates.",
      "Whether you prefer tense thrillers, heartwarming comedies, or sprawling fantasy epics, there is a series on this list that belongs on your watchlist. The key is to start with one that matches your current mood and let the algorithm introduce you to the rest.",
    ],
  },
};

export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = articles[params.slug];

  if (!article) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <p className="text-muted-foreground">
          This article does not exist or has been removed.
        </p>
      </div>
    );
  }

  const url = `${SITE_URL}/blog/${params.slug}`;
  const imageUrl = `${SITE_URL}/api/og/static/blog`;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 space-y-8 bg-background text-foreground">
      <ArticleJsonLd
        title={article.title}
        description={articles[params.slug] ? articles[params.slug].excerpt ?? "" : ""}
        url={url}
        image={imageUrl}
        datePublished={new Date(article.date).toISOString()}
        authorName="BingeWise Team"
        authorUrl="https://www.bingewise.net/legal/about"
      />

      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>BingeWise Blog</span>
          <span>&middot;</span>
          <time>{article.date}</time>
          <span>&middot;</span>
          <span>{article.readTime}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {article.title}
        </h1>
      </header>

      <main className="space-y-6 text-muted-foreground leading-relaxed">
        {article.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </main>
    </article>
  );
}
