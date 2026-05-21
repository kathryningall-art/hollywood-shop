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
  { host: "etsy.com",       retailer: "Etsy",       network: "etsy",      tier: "reproduction" },
  { host: "amazon.com",     retailer: "Amazon",     network: "amazon",    tier: "modern" },
  { host: "nordstrom.com",  retailer: "Nordstrom",  network: "nordstrom", tier: "modern" },
  { host: "poshmark.com",   retailer: "Poshmark",   network: "direct",    tier: "pre_owned" },
  { host: "thredup.com",    retailer: "ThredUp",    network: "direct",    tier: "pre_owned" },
  { host: "depop.com",      retailer: "Depop",      network: "direct",    tier: "pre_owned" },
  { host: "ebay.com",       retailer: "eBay",       network: "direct",    tier: "pre_owned" },
  { host: "asos.com",       retailer: "ASOS",       network: "direct",    tier: "modern" },
  { host: "modcloth.com",   retailer: "ModCloth",   network: "direct",    tier: "reproduction" },
  { host: "shopbop.com",    retailer: "Shopbop",    network: "direct",    tier: "modern" },
];

function detectSite(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const match = SITE_MAP.find((s) => host.includes(s.host));
  if (match) return match;
  const name = host.split(".")[0];
  return {
    retailer: name.charAt(0).toUpperCase() + name.slice(1),
    network: "direct",
    tier: "modern" as MatchTier,
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

// ─── Title cleanup ────────────────────────────────────────────────

const SHOUTY_PREFIXES = [
  /^bogo\s+special!?\s*/i,
  /^free\s+shipping!?\s*/i,
  /^sale!?\s*/i,
  /^new!?\s*/i,
  /^hot!?\s*/i,
  /^on\s+sale!?\s*/i,
  /^clearance!?\s*/i,
  /^limited\s+time!?\s*/i,
  /^ships?\s+now!?\s*/i,
  /^\([^)]*ships?\s+now[^)]*\)\s*/i,
];

function titleCaseWord(word: string): string {
  // Preserve short connector words in lowercase if not first
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function cleanTitle(raw: string | null): string | null {
  if (!raw) return raw;
  let title = raw.trim();
  // Strip shouty prefixes (apply repeatedly in case there are several)
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of SHOUTY_PREFIXES) {
      if (re.test(title)) {
        title = title.replace(re, "");
        changed = true;
      }
    }
  }
  // If the whole title is ALL CAPS or mostly caps, convert to Title Case
  const letters = title.replace(/[^a-zA-Z]/g, "");
  const upperCount = (title.match(/[A-Z]/g) ?? []).length;
  if (letters.length > 0 && upperCount / letters.length > 0.6) {
    title = title
      .split(/\s+/)
      .map((w, i) => {
        // keep small connector words lowercase mid-sentence
        if (i > 0 && /^(and|or|of|the|a|an|in|on|for|with|to)$/i.test(w))
          return w.toLowerCase();
        return titleCaseWord(w);
      })
      .join(" ");
  }
  return title.trim() || null;
}

// ─── Size extraction ──────────────────────────────────────────────

const LETTER_SIZES = "XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL";
const WORD_SIZES = "extra\\s+small|extra\\s+large|small|medium|large";

function extractSizeFromTitle(title: string): string | null {
  if (!title) return null;

  // Pattern 1: "Size X" / "Size: X" / "Sz X" — most reliable
  const labeled = title.match(
    new RegExp(`\\b(?:size|sz)[:\\s]+(${LETTER_SIZES}|${WORD_SIZES}|\\d+(?:\\.\\d+)?(?:W|T|P)?)\\b`, "i")
  );
  if (labeled) return normalizeSize(labeled[1]);

  // Pattern 2: parenthetical — "(Size M)" or "(M)"
  const paren = title.match(
    new RegExp(`\\((?:size[:\\s]+)?(${LETTER_SIZES}|${WORD_SIZES}|\\d+(?:\\.\\d+)?(?:W|T|P)?)\\)`, "i")
  );
  if (paren) return normalizeSize(paren[1]);

  // Pattern 3: trailing — "..., Small" or "... - M" at end of title
  const trailing = title.match(
    new RegExp(`[,\\-]\\s*(${LETTER_SIZES}|${WORD_SIZES})\\s*$`, "i")
  );
  if (trailing) return normalizeSize(trailing[1]);

  return null;
}

function normalizeSize(raw: string): string {
  const trimmed = raw.trim();
  // Letter sizes — uppercase
  if (/^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  // Word sizes — Title Case ("Small", "Extra Large")
  if (/^(extra\s+small|extra\s+large|small|medium|large)$/i.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  // Numeric sizes — keep digits, uppercase suffix
  return trimmed.replace(/(\d)([a-zA-Z])/g, (_, d, l) => d + l.toUpperCase());
}

// ─── Etsy API fetcher ─────────────────────────────────────────────

function extractEtsyListingId(url: string): string | null {
  const m = url.match(/\/listing\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchFromEtsyApi(url: string): Promise<{ title: string | null; image_url: string | null; price_display: string | null; size: string | null }> {
  const listingId = extractEtsyListingId(url);
  if (!listingId) throw new Error("Could not parse Etsy listing ID from URL");

  const apiKey = process.env.ETSY_API_KEY;
  const sharedSecret = process.env.ETSY_SHARED_SECRET;
  if (!apiKey || !sharedSecret) throw new Error("Etsy API credentials not configured");

  const res = await fetch(
    `https://openapi.etsy.com/v3/application/listings/${listingId}?includes=Images`,
    {
      headers: { "x-api-key": `${apiKey}:${sharedSecret}` },
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Etsy API error ${res.status}: ${body.slice(0, 120)}`);
  }

  const listing = await res.json() as {
    title?: string;
    price?: { amount: number; divisor: number; currency_code: string };
    images?: Array<{ url_570xN?: string; url_fullxfull?: string }>;
  };

  const rawTitle = listing.title ?? null;
  const size = rawTitle ? extractSizeFromTitle(rawTitle) : null;
  const title = cleanTitle(rawTitle);

  const image_url =
    listing.images?.[0]?.url_570xN ?? listing.images?.[0]?.url_fullxfull ?? null;

  let price_display: string | null = null;
  if (listing.price) {
    const { amount, divisor, currency_code } = listing.price;
    price_display = formatPrice(amount / divisor, currency_code);
  }

  return { title, image_url, price_display, size };
}

// ─── Exported server action ───────────────────────────────────────

export async function importProductsFromUrls(urls: string[]): Promise<ImportedProduct[]> {
  const settled = await Promise.allSettled(
    urls.map(async (url): Promise<ImportedProduct> => {
      const { retailer, network, tier } = detectSite(url);
      const isEtsy = new URL(url).hostname.includes("etsy.com");
      console.log("[import]", url.slice(0, 60), "| isEtsy:", isEtsy, "| apiKey:", !!process.env.ETSY_API_KEY);
      try {
        let title: string | null, image_url: string | null, price_display: string | null, size: string | null;

        if (isEtsy) {
          ({ title, image_url, price_display, size } = await fetchFromEtsyApi(url));
        } else {
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
          ({ title, image_url, price_display, size } = extractData(html, url));
        }

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
      match_tier: "modern" as MatchTier,
      image_url: null, price_display: null, size: null, error: "Unexpected error",
    }
  );
}
