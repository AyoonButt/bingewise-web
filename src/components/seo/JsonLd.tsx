const SITE_URL = "https://www.bingewise.net";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  email?: string;
  twitter?: string;
}

export function OrganizationJsonLd({
  name = "BingeWise",
  url = SITE_URL,
  logo = `${SITE_URL}/images/bingewise_appicon.png`,
  email = "support@bingewise.net",
  twitter = "#",
}: OrganizationJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORG_ID,
        name,
        url,
        logo,
        email,
        sameAs: [twitter],
      }}
    />
  );
}

interface WebSiteJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebSiteJsonLd({
  name = "BingeWise",
  url = SITE_URL,
  description = "Discover your next favorite TV show and movie. BingeWise learns what you love and serves personalized recommendations across all your streaming services.",
}: WebSiteJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name,
        url,
        description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${url}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageJsonLdProps {
  faqs: FAQItem[];
}

export function FAQPageJsonLd({ faqs }: FAQPageJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
}: ArticleJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url,
        ...(image ? { image } : {}),
        datePublished,
        ...(dateModified ? { dateModified } : {}),
        author: {
          "@type": "Person",
          name: authorName,
          ...(authorUrl ? { url: authorUrl } : {}),
        },
        publisher: {
          "@type": "Organization",
          "@id": ORG_ID,
          name: "BingeWise",
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/images/bingewise_appicon.png`,
          },
        },
      }}
    />
  );
}

interface PersonJsonLdProps {
  name: string;
  url: string;
  description?: string;
  image?: string;
}

export function PersonJsonLd({ name, url, description, image }: PersonJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name,
        url,
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
      }}
    />
  );
}

interface ItemListJsonLdProps {
  name: string;
  description?: string;
  url: string;
  items: { name: string; url: string; position: number }[];
}

export function ItemListJsonLd({ name, description, url, items }: ItemListJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        ...(description ? { description } : {}),
        url,
        itemListElement: items.map((item) => ({
          "@type": "ListItem",
          position: item.position,
          name: item.name,
          url: item.url,
        })),
      }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
