import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import type { NormalizedResult, SearchProvider } from "./types";

const SERPER_ENDPOINT = "https://google.serper.dev/shopping";
const CACHE_VERSION = "v2-shopping"; // bump to invalidate older cache entries
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const THROTTLE_MS = 200;
const MAX_RETRIES = 4;

const DEFAULT_BLACKLIST = ["aliexpress.com", "wish.com", "temu.com", "shein.com"];

function getBlacklist(): string[] {
  const env = process.env.BLACKLIST_RETAILERS;
  if (!env) return DEFAULT_BLACKLIST;
  return env.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isBlacklisted(url: string, blacklist: string[]): boolean {
  const host = hostnameOf(url);
  if (!host) return true;
  return blacklist.some((b) => host === b || host.endsWith(`.${b}`));
}

// Pull a price from a snippet like "Sale $42.50" or "£120". Best-effort only.
const PRICE_RE = /(?:USD|US\$|\$|£|€)\s?\d{1,5}(?:[.,]\d{2})?/i;
function parsePrice(snippet: string | undefined): string | null {
  if (!snippet) return null;
  const m = snippet.match(PRICE_RE);
  return m ? m[0].trim() : null;
}

function hashKey(query: string, num: number): string {
  return createHash("sha256").update(`${CACHE_VERSION}::${query}::${num}`).digest("hex");
}

type SerperShoppingItem = {
  title?: string;
  link?: string;
  source?: string;
  price?: string;
  imageUrl?: string;
};

type SerperOrganicItem = {
  title?: string;
  link?: string;
  snippet?: string;
  imageUrl?: string;
};

type SerperResponse = {
  shopping?: SerperShoppingItem[];
  organic?: SerperOrganicItem[];
  images?: { imageUrl?: string; link?: string }[];
};

let lastCallAt = 0;
async function throttle() {
  const wait = THROTTLE_MS - (Date.now() - lastCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export class SerperProvider implements SearchProvider {
  private readonly apiKey: string;
  private readonly blacklist: string[];

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.SERPER_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error("SERPER_API_KEY is not set");
    }
    this.blacklist = getBlacklist();
  }

  async search(query: string, num_results = 25): Promise<NormalizedResult[]> {
    const supabase = createServiceClient();
    const key = hashKey(query, num_results);

    // 1. Read cache FIRST.
    const { data: cached } = await supabase
      .from("serper_cache")
      .select("response, cached_at")
      .eq("query_hash", key)
      .maybeSingle();

    let response: SerperResponse | null = null;

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime();
      if (age < CACHE_TTL_MS) {
        response = cached.response as SerperResponse;
      }
    }

    // 2. Fetch if missing/expired.
    if (!response) {
      response = await this.fetchWithBackoff(query, num_results);
      await supabase
        .from("serper_cache")
        .upsert(
          {
            query_hash: key,
            query,
            num_results,
            response,
            cached_at: new Date().toISOString(),
          },
          { onConflict: "query_hash" }
        );
    }

    return this.normalize(response, query);
  }

  private async fetchWithBackoff(query: string, num: number): Promise<SerperResponse> {
    let attempt = 0;
    while (true) {
      await throttle();
      const res = await fetch(SERPER_ENDPOINT, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num }),
      });

      if (res.ok) {
        return (await res.json()) as SerperResponse;
      }

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const backoff = 500 * 2 ** attempt + Math.random() * 200;
        await new Promise((r) => setTimeout(r, backoff));
        attempt += 1;
        continue;
      }

      const body = await res.text();
      throw new Error(`Serper ${res.status}: ${body.slice(0, 200)}`);
    }
  }

  private normalize(response: SerperResponse, query: string): NormalizedResult[] {
    const out: NormalizedResult[] = [];
    const seen = new Set<string>();

    // /shopping returns product cards with imageUrl, price, source (retailer).
    const shopping = response.shopping ?? [];
    for (const item of shopping) {
      if (!item.link || !item.imageUrl) continue;
      if (seen.has(item.link)) continue;
      if (isBlacklisted(item.link, this.blacklist)) continue;
      seen.add(item.link);
      out.push({
        title: item.title ?? "",
        product_url: item.link,
        image_url: item.imageUrl,
        price: item.price ?? null,
        retailer: item.source ?? hostnameOf(item.link),
        source_query: query,
        raw: item,
      });
    }

    return out;
  }
}
