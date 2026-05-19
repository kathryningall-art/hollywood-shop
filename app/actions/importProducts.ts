"use server";

import type { MatchTier } from "@/app/components/ProductFrame";

export type ImportedProduct = {
  url: string;
  title: string | null;
  retailer: string;
  network: string;
  match_tier: MatchTier;
  image_url: string | null;
  price_display: string | null;
  size: string | null;
  error: string | null; // null = success
};

// ─── Site detection ───────────────────────────────────────────────

const SITE_MAP: Array<{ host: string; retailer: string; network: string; tier: MatchTier }> = [
  { host: "etsy.com",       retailer: "Etsy",       network: "etsy",      tier: "vintage_reproduction" },
  { host: "amazon.com",     retailer: "Amazon",     network: "amazon",    tier: "modern_inspired" },
  { host: "nordstrom.com",  retailer: "Nordstrom",  network: "nordstrom", tier: "modern_inspired" },
  { host: "poshmark.com",   retailer: "Poshmark",   network: "direct",    tier: "vintage_pre_owned" },
  { host: "thredup.com",    retailer: "ThredUp",    network: "direct",    tier: "vintage_pre_owned" },
  { host: "depop.com",      retailer: "Depop",      network: "direct",    tier: "vintage_pre_owned" },
  { host: "ebay.com",       retailer: "eBay",       network: "direct",    tier: "vintage_pre_owned" },
  { host: "asos.com",       retailer: "ASOS",       network: "direct",    tier: "modern_inspired" },
  { host: "modcloth.com",   retailer: "ModCloth",   network: "direct",    tier: "vintage_reproduction" },
  { host: "shopbop.com",    retailer: "Shopbop",    network: "direct",    tier: "modern_inspired" },
];

function detectSite(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const match = SITE_MAP.find((s) => host.includes(s.host));
  if (match) return match;
  const name = host.split(".")[0];
  return {
    retailer: name.charAt(0).toUpperCase() + name.slice(1),
    network: "direct",
    tier: "modern_inspired" as MatchTier,
  };
}

// ─── HTML parsing helpers ─────────────────────────────────────────

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n)))
    .trim();
}

function extractOgTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re = /<meta[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const propM = m[0].match(/(?:property|name)=["']([^"']+)["']/);
    const contM = m[0].match(/content=["']([^"']*)["']/);
    if (propM && contM) tags[propM[1]] = decodeEntities(contM[1]);
  }
  return tags;
}

function extractJsonLdProduct(html: string): Record<string, unknown> | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      let data: unknown = JSON.parse(m[1]);
      if (data && typeof data === "object" && "@graph" in data)
        data = (data as Record<string, unknown>)["@graph"];
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const type = (item as Record<string, unknown>)["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product")))
          return item as Record<string, unknown>;
      }
    } catch { /* skip malformed */ }
  }
  return null;
}

function formatPrice(amount: unknown, currency = "USD"): string | null {
  const num = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  const sym = ({ USD: "$", GBP: "£", EUR: "€", CAD: "CA$" } as Record<string, string>)[currency] ?? "$";
  return num % 1 === 0 ? `${sym}${num.toFixed(0)}` : `${sym}${num.toFixed(2)}`;
}

// ─── Core extractor ───────────────────────────────────────────────

function extractData(html: string, url: string) {
  const og  = extractOgTags(html);
  const ld  = extractJsonLdProduct(html);
  const host = new URL(url).hostname;

  // Title
  let title: string | null =
    (ld?.name ? decodeEntities(String(ld.name)) : null) ??
    og["og:title"] ?? og["twitter:title"] ?? null;
  if (title) {
    title = title
      .replace(/\s*[-|—·]\s*(Etsy|Amazon\.com|Amazon|Poshmark|Nordstrom|eBay|ThredUp|Depop|ASOS)[^]*$/i, "")
      .trim();
  }

  // Image
  let image_url: string | null = null;
  const ldImg = ld?.image;
  if (typeof ldImg === "string") image_url = ldImg;
  else if (Array.isArray(ldImg) && ldImg.length) image_url = String(ldImg[0]);
  else if (ldImg && typeof ldImg === "object" && "url" in (ldImg as object))
    image_url = String((ldImg as Record<string, unknown>).url);
  image_url ??= og["og:image"] ?? og["twitter:image"] ?? null;

  // Price
  let price_display: string | null = null;
  const rawOffers = ld?.offers;
  const offer = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as Record<string, unknown> | undefined;
  if (offer?.price != null) {
    price_display = formatPrice(offer.price, String(offer.priceCurrency ?? "USD"));
  } else if (og["product:price:amount"]) {
    price_display = formatPrice(og["product:price:amount"], og["product:price:currency"] ?? "USD");
  } else if (og["og:price:amount"]) {
    price_display = formatPrice(og["og:price:amount"], og["og:price:currency"] ?? "USD");
  }

  // Size
  let size: string | null = null;
  if (ld?.size) size = String(ld.size);
  else if (offer?.itemOffered && typeof offer.itemOffered === "object") {
    const io = offer.itemOffered as Record<string, unknown>;
    if (io.size) size = String(io.size);
  }
  for (const prop of (ld?.additionalProperty as Record<string, unknown>[] | undefined) ?? []) {
    if (/^(size|clothing.?size)$/i.test(String(prop.name ?? ""))) {
      size = String(prop.value ?? "").trim();
      break;
    }
  }
  // Poshmark keeps size in og:description
  if (!size && host.includes("poshmark.com")) {
    const m = (og["og:description"] ?? "").match(/\bSize[:\s]+([^\s,|·–-]+)/i);
    if (m) size = m[1].trim();
  }

  return { title, image_url, price_display, size };
}

// ─── Exported server action ───────────────────────────────────────

export async function importProductsFromUrls(urls: string[]): Promise<ImportedProduct[]> {
  const settled = await Promise.allSettled(
    urls.map(async (url): Promise<ImportedProduct> => {
      const { retailer, network, tier } = detectSite(url);
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} — try adding manually`);
        const html = await res.text();
        const { title, image_url, price_display, size } = extractData(html, url);
        return { url, title, retailer, network, match_tier: tier, image_url, price_display, size, error: null };
      } catch (err) {
        return {
          url, title: null, retailer, network, match_tier: tier,
          image_url: null, price_display: null, size: null,
          error: err instanceof Error ? err.message : "Failed to fetch",
        };
      }
    })
  );

  return settled.map((r) =>
    r.status === "fulfilled" ? r.value : {
      url: "", title: null, retailer: "Unknown", network: "direct",
      match_tier: "modern_inspired" as MatchTier,
      image_url: null, price_display: null, size: null, error: "Unexpected error",
    }
  );
}
