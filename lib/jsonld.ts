import { SITE_URL, absoluteUrl, truncate } from "@/lib/og";

const LOGO_URL = `${SITE_URL}/brand/M4-lockup-horizontal.png`;

/** Escape < and > so editorial content can't break the script tag. */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bias Cut Bureau",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL },
    description:
      "Shop the looks of classic Hollywood's golden age — public-domain imagery, modern pieces inspired by the screen sirens of 1915–1969.",
  };
}

export function breadcrumbSchema(
  items: Array<{ name: string; url?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function articleSchema({
  title,
  description,
  imageUrl,
  pageUrl,
  aboutName,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  pageUrl: string;
  aboutName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(title, 110),
    description: truncate(description, 200),
    url: pageUrl,
    ...(imageUrl ? { image: absoluteUrl(imageUrl) } : {}),
    publisher: {
      "@type": "Organization",
      name: "Bias Cut Bureau",
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    ...(aboutName ? { about: { "@type": "Person", name: aboutName } } : {}),
  };
}

export function personSchema({
  name,
  description,
  imageUrl,
  pageUrl,
}: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  pageUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: pageUrl,
    ...(description ? { description: truncate(description, 200) } : {}),
    ...(imageUrl ? { image: absoluteUrl(imageUrl) } : {}),
  };
}
