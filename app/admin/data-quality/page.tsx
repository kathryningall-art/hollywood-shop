import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { MatchTier } from "@/app/components/ProductFrame";
import DataQualityClient, { type FlaggedProduct, type Issue } from "./DataQualityClient";

export const metadata: Metadata = { title: "Data Quality — Admin" };

// ─── Known sites ──────────────────────────────────────────────────────────────

const KNOWN_SITES: Array<{
  host: string;
  retailer: string;
  tier: MatchTier | null; // null = multiple valid tiers (e.g. Etsy)
}> = [
  { host: "etsy.com",          retailer: "Etsy",          tier: null },
  { host: "amazon.com",        retailer: "Amazon",        tier: "modern" },
  { host: "nordstrom.com",     retailer: "Nordstrom",     tier: "modern" },
  { host: "poshmark.com",      retailer: "Poshmark",      tier: "pre_owned" },
  { host: "thredup.com",       retailer: "ThredUp",       tier: "pre_owned" },
  { host: "depop.com",         retailer: "Depop",         tier: "pre_owned" },
  { host: "ebay.com",          retailer: "eBay",          tier: "pre_owned" },
  { host: "asos.com",          retailer: "ASOS",          tier: "modern" },
  { host: "modcloth.com",      retailer: "ModCloth",      tier: "reproduction" },
  { host: "shopbop.com",       retailer: "Shopbop",       tier: "modern" },
  { host: "net-a-porter.com",  retailer: "Net-a-Porter",  tier: "modern" },
  { host: "target.com",        retailer: "Target",        tier: "modern" },
  { host: "anthropologie.com", retailer: "Anthropologie", tier: "modern" },
  { host: "therealreal.com",   retailer: "The Real Real", tier: "pre_owned" },
  { host: "walmart.com",       retailer: "Walmart",       tier: "modern" },
  { host: "macys.com",         retailer: "Macy's",        tier: "modern" },
];

const VALID_PRICE_RE = /^(CA\$|[£€\$])\d+(\.\d{2})?$/;

const TIER_LABELS: Record<MatchTier, string> = {
  vintage:      "Vintage",
  pre_owned:    "Pre-Owned",
  reproduction: "Reproduction",
  modern:       "Modern",
};

// ─── Detection ────────────────────────────────────────────────────────────────

type RawProduct = {
  id: string;
  title: string | null;
  retailer: string | null;
  network: string | null;
  match_tier: string | null;
  affiliate_url: string | null;
  price_display: string | null;
  image_url: string | null;
  look_id: string | null;
  looks: { id: string; title: string } | null;
};

function detectIssues(p: RawProduct): Issue[] {
  const issues: Issue[] = [];
  const title = p.title ?? "";
  const tier = p.match_tier as MatchTier | null;

  // Find site info
  let hostInfo: (typeof KNOWN_SITES)[number] | null = null;
  let hostname = "";
  if (p.affiliate_url) {
    try {
      hostname = new URL(p.affiliate_url).hostname.replace(/^www\./, "");
      hostInfo = KNOWN_SITES.find((s) => hostname.includes(s.host)) ?? null;
    } catch { /* malformed URL flagged below */ }
  }

  // [A] Retailer label mismatch
  if (hostInfo?.retailer && p.retailer && hostInfo.retailer !== p.retailer) {
    issues.push({
      code: "A",
      message: `Label says "${p.retailer}" but URL is ${hostInfo.retailer}`,
      autoFix: { field: "retailer", value: hostInfo.retailer },
    });
  }

  // [B] Tier mismatch — only for sites with a strict single expected tier
  if (hostInfo?.tier && tier && hostInfo.tier !== tier) {
    issues.push({
      code: "B",
      message: `Is "${TIER_LABELS[tier]}" but ${hostInfo.retailer ?? p.retailer} should be "${TIER_LABELS[hostInfo.tier]}"`,
      autoFix: { field: "match_tier", value: hostInfo.tier },
    });
  }

  // [C] URL in title
  if (/https?:\/\//i.test(title)) {
    issues.push({ code: "C", message: "Title contains a URL" });
  }

  // [D] Price in title
  if (/\$\d/.test(title) || /\b(USD|GBP|EUR)\b/i.test(title)) {
    issues.push({ code: "D", message: `Title contains price text: "${title.slice(0, 60)}"` });
  }

  // [E] All-caps title
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 4 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
    issues.push({ code: "E", message: "Title is all-caps" });
  }

  // [F] Non-standard price format
  if (p.price_display !== null && !VALID_PRICE_RE.test(p.price_display)) {
    issues.push({ code: "F", message: `"${p.price_display}" doesn't match standard format ($XX or $XX.XX)` });
  }

  // [J] Unmapped domain
  if (p.affiliate_url) {
    if (!hostname) {
      issues.push({ code: "J", message: "Affiliate URL is malformed" });
    } else if (!hostInfo) {
      issues.push({ code: "J", message: `Domain "${hostname}" is not in the known sites list` });
    }
  }

  return issues;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DataQualityPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, title, retailer, network, match_tier, affiliate_url, price_display, image_url, look_id, looks(id, title)")
    .order("id");

  if (error) {
    return <p className="text-red-600 font-mono text-sm p-6">Database error: {error.message}</p>;
  }

  const raw = (data ?? []) as unknown as RawProduct[];

  const flagged: FlaggedProduct[] = raw
    .map((p) => ({
      id: p.id,
      title: p.title,
      retailer: p.retailer,
      network: p.network,
      match_tier: p.match_tier as MatchTier | null,
      affiliate_url: p.affiliate_url,
      price_display: p.price_display,
      image_url: p.image_url,
      look_id: p.look_id,
      look_title: (p.looks as { id: string; title: string } | null)?.title ?? null,
      issues: detectIssues(p),
    }))
    .filter((p) => p.issues.length > 0);

  return (
    <DataQualityClient
      initialProducts={flagged}
      totalCount={raw.length}
    />
  );
}
