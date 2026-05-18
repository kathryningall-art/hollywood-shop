#!/usr/bin/env node
/**
 * import-products.mjs
 *
 * Fetches product pages and imports them as Products under a specific Look.
 *
 * HOW TO USE:
 *   1. Find the Look ID in the admin URL: /admin/looks/[this-id-here]/products
 *   2. Paste it into LOOK_ID below
 *   3. Paste your product URLs into URLS (up to ~12 at a time)
 *   4. Run:  node scripts/import-products.mjs
 *      This runs in DRY RUN mode — it shows what would be imported but saves nothing.
 *   5. If everything looks right, change DRY_RUN to false and run again to save.
 *
 * WORKS WELL WITH: Etsy, Poshmark, Nordstrom, ThredUp, Depop, eBay, ASOS
 * HIT-OR-MISS:     Amazon (they actively block scrapers — add those manually in admin)
 *
 * Tier is guessed from the platform — you can adjust in admin after importing:
 *   Poshmark / ThredUp / Depop / eBay  →  Vintage / Pre-Owned
 *   Etsy                               →  Vintage Reproduction (adjust if needed)
 *   Amazon / Nordstrom / ASOS          →  Modern Inspired
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local without needing the dotenv package
try {
  const env = readFileSync(join(__dir, "../.env.local"), "utf8");
  for (const line of env.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found — env vars must be set externally */ }

// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDIT THESE before running                                       ║
// ╚══════════════════════════════════════════════════════════════════╝

const LOOK_ID = "PASTE-LOOK-ID-HERE";
const DRY_RUN = true;   // ← change to false to actually save to the database

const URLS = [
  // Paste product URLs here, one per line, e.g.:
  // "https://www.etsy.com/listing/1234567890/vintage-1930s-bias-cut-gown",
  // "https://poshmark.com/listing/Vintage-Silk-Slip-Dress-60a1234abc5678901234567",
  // "https://www.nordstrom.com/s/dress/1234567",
];

// ════════════════════════════════════════════════════════════════════

// ─── Retailer / network / tier detection ─────────────────────────

const SITE_MAP = [
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
  { host: "net-a-porter.com",retailer: "Net-a-Porter",network: "direct",  tier: "modern_inspired" },
];

function siteInfo(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const match = SITE_MAP.find((s) => host.includes(s.host));
  if (match) return match;
  // Fallback: capitalise the domain name
  const name = host.split(".")[0];
  return {
    retailer: name.charAt(0).toUpperCase() + name.slice(1),
    network: "direct",
    tier: "modern_inspired",
  };
}

// ─── Fetch ───────────────────────────────────────────────────────

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

// ─── HTML helpers ────────────────────────────────────────────────

function decodeEntities(str) {
  return (str ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
}

function extractOgTags(html) {
  const tags = {};
  const re = /<meta[^>]+>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const propM = tag.match(/(?:property|name)=["']([^"']+)["']/);
    const contM = tag.match(/content=["']([^"']*?)["']/s);
    if (propM && contM) tags[propM[1]] = decodeEntities(contM[1]);
  }
  return tags;
}

function extractJsonLdProduct(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      let data = JSON.parse(m[1]);
      // Some sites wrap everything in @graph
      if (data["@graph"]) data = data["@graph"];
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const type = item["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
          return item;
        }
      }
    } catch {
      // Malformed JSON — skip
    }
  }
  return null;
}

// ─── Price formatting ────────────────────────────────────────────

function formatPrice(amount, currency = "USD") {
  const num = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  const symbol = { USD: "$", GBP: "£", EUR: "€", CAD: "CA$" }[currency] ?? "$";
  return num % 1 === 0 ? `${symbol}${num.toFixed(0)}` : `${symbol}${num.toFixed(2)}`;
}

// ─── Main extractor ──────────────────────────────────────────────

function extractProduct(html, url) {
  const og  = extractOgTags(html);
  const ld  = extractJsonLdProduct(html);
  const host = new URL(url).hostname;

  // ── Title ──────────────────────────────────────────────────────
  let title =
    (ld?.name ? decodeEntities(String(ld.name)) : null) ??
    og["og:title"] ??
    og["twitter:title"] ??
    null;

  if (title) {
    // Strip " | Etsy", " - Amazon.com", etc.
    title = title
      .replace(/\s*[-|—·]\s*(Etsy|Amazon\.com|Amazon|Poshmark|Nordstrom|eBay|ThredUp|Depop|ASOS)[^]*$/i, "")
      .trim();
  }

  // ── Image ──────────────────────────────────────────────────────
  let imageUrl = null;
  const ldImg = ld?.image;
  if (typeof ldImg === "string") imageUrl = ldImg;
  else if (Array.isArray(ldImg) && ldImg.length) imageUrl = ldImg[0];
  else if (ldImg?.url) imageUrl = ldImg.url;
  imageUrl ??= og["og:image"] ?? og["twitter:image"] ?? null;

  // Etsy appends ?version=X — keep it but strip tracking params from others
  if (imageUrl && !host.includes("etsy.com")) {
    try { imageUrl = new URL(imageUrl).origin + new URL(imageUrl).pathname; } catch {}
  }

  // ── Price ──────────────────────────────────────────────────────
  let priceDisplay = null;
  const offer = Array.isArray(ld?.offers) ? ld.offers[0] : (ld?.offers ?? null);
  if (offer?.price != null) {
    priceDisplay = formatPrice(offer.price, offer.priceCurrency ?? "USD");
  } else if (og["product:price:amount"]) {
    priceDisplay = formatPrice(og["product:price:amount"], og["product:price:currency"] ?? "USD");
  } else if (og["og:price:amount"]) {
    priceDisplay = formatPrice(og["og:price:amount"], og["og:price:currency"] ?? "USD");
  }

  // ── Size ───────────────────────────────────────────────────────
  let size = null;

  // Direct size field (Poshmark JSON-LD)
  if (ld?.size) size = String(ld.size);
  else if (offer?.itemOffered?.size) size = String(offer.itemOffered.size);

  // additionalProperty array (Etsy, Poshmark)
  for (const prop of ld?.additionalProperty ?? []) {
    if (/^(size|clothing.?size)$/i.test(prop.name ?? "")) {
      size = String(prop.value ?? "").trim();
      break;
    }
  }

  // Poshmark keeps size in og:description ("Size: M, ...")
  if (!size && host.includes("poshmark.com")) {
    const desc = og["og:description"] ?? "";
    const m = desc.match(/\bSize[:\s]+([^\s,|·–-]+)/i);
    if (m) size = m[1].trim();
  }

  return { title, imageUrl, priceDisplay, size };
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  // ── Validate config ──────────────────────────────────────────
  if (LOOK_ID === "PASTE-LOOK-ID-HERE") {
    console.error("\n❌  Set LOOK_ID at the top of the script first.\n");
    process.exit(1);
  }
  if (!URLS.length) {
    console.error("\n❌  Add at least one URL to the URLS array first.\n");
    process.exit(1);
  }

  // ── Supabase ──────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Verify look exists
  const { data: look, error: lookErr } = await supabase
    .from("looks")
    .select("id, title")
    .eq("id", LOOK_ID)
    .single();

  if (lookErr || !look) {
    console.error(`\n❌  Look not found with ID: ${LOOK_ID}\n`);
    process.exit(1);
  }

  // Current highest display_order for this look
  const { data: existing } = await supabase
    .from("products")
    .select("display_order")
    .eq("look_id", LOOK_ID)
    .order("display_order", { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

  // ── Process URLs ──────────────────────────────────────────────
  console.log(`\n🎬  Look:  "${look.title}"`);
  console.log(`🔗  URLs:  ${URLS.length}`);
  console.log(DRY_RUN ? "👁   Mode:  DRY RUN (nothing will be saved)\n" : "💾  Mode:  LIVE — will save to database\n");

  // Warn about Amazon
  if (URLS.some((u) => u.includes("amazon."))) {
    console.log("⚠️   Amazon URLs detected — these often fail due to bot protection.");
    console.log("    If they error, add those products manually in admin.\n");
  }

  const toInsert = [];

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i];
    const { retailer, network, tier } = siteInfo(url);
    const shortHost = new URL(url).hostname.replace(/^www\./, "");

    process.stdout.write(`[${i + 1}/${URLS.length}] ${shortHost} … `);

    try {
      const html = await fetchPage(url);
      const { title, imageUrl, priceDisplay, size } = extractProduct(html, url);

      const product = {
        look_id: LOOK_ID,
        title: title ?? "(untitled — edit in admin)",
        retailer,
        network,
        match_tier: tier,
        affiliate_url: url,
        image_url: imageUrl ?? null,
        price_display: priceDisplay ?? null,
        size: size ?? null,
        display_order: nextOrder++,
      };

      const warnings = [
        !title       && "no title",
        !imageUrl    && "no image",
        !priceDisplay && "no price",
      ].filter(Boolean);

      console.log(warnings.length ? `⚠️  (${warnings.join(", ")})` : "✓");
      console.log(`     Tier:   ${product.match_tier.replace(/_/g, " ")}`);
      console.log(`     Title:  ${product.title}`);
      console.log(`     Price:  ${product.price_display ?? "—"}`);
      console.log(`     Size:   ${product.size ?? "—"}`);
      console.log(`     Image:  ${product.image_url ? "✓ found" : "✗ missing"}`);
      console.log();

      toInsert.push(product);
    } catch (err) {
      console.log(`❌  ${err.message}`);
      console.log(`     Skipping — add manually in admin.\n`);
    }

    // Polite delay between requests
    if (i < URLS.length - 1) await new Promise((r) => setTimeout(r, 900));
  }

  // ── Results ───────────────────────────────────────────────────
  if (!toInsert.length) {
    console.log("Nothing to insert — all URLs failed.\n");
    return;
  }

  if (DRY_RUN) {
    console.log("─".repeat(60));
    console.log(`✋  DRY RUN complete.`);
    console.log(`   ${toInsert.length} product(s) ready to import.`);
    console.log(`   Set DRY_RUN = false and run again to save them.\n`);
    return;
  }

  // ── Insert ────────────────────────────────────────────────────
  console.log(`💾  Saving ${toInsert.length} product(s)…`);
  const { error: insertErr } = await supabase.from("products").insert(toInsert);

  if (insertErr) {
    console.error("❌  Insert failed:", insertErr.message);
    process.exit(1);
  }

  console.log(`✅  Done! Review and adjust tiers/images at:`);
  console.log(`   /admin/looks/${LOOK_ID}/products\n`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
