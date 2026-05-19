import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MatchTier } from "@/app/components/ProductFrame";

export const metadata: Metadata = { title: "Data Quality — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

type RawProduct = {
  id: string;
  title: string | null;
  retailer: string | null;
  network: string | null;
  match_tier: MatchTier | null;
  affiliate_url: string | null;
  price_display: string | null;
  image_url: string | null;
  look_id: string | null;
  looks: { id: string; title: string } | null;
};

type FlaggedProduct = RawProduct & {
  issues: string[];
};

// ─── Detection rules ──────────────────────────────────────────────────────────

/** Maps affiliate_url hostname → expected {retailer, tier} */
const KNOWN_SITES: Array<{
  host: string;
  retailer: string;
  tier: MatchTier | null; // null = flexible (multiple valid tiers)
}> = [
  { host: "etsy.com",          retailer: "Etsy",          tier: null },      // vintage / pre_owned / reproduction all valid
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

function getHostInfo(url: string | null) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_SITES.find((s) => host.includes(s.host)) ?? { host, retailer: null, tier: null as MatchTier | null };
  } catch {
    return null;
  }
}

function detectIssues(p: RawProduct): string[] {
  const issues: string[] = [];
  const title = p.title ?? "";
  const hostInfo = getHostInfo(p.affiliate_url);

  // [A] Retailer label mismatch
  if (hostInfo?.retailer && p.retailer && hostInfo.retailer !== p.retailer) {
    issues.push(`A: Retailer label says "${p.retailer}" but URL suggests "${hostInfo.retailer}"`);
  }

  // [B] Tier mismatch — only flag sites with a strict single expected tier
  if (hostInfo?.tier && p.match_tier && hostInfo.tier !== p.match_tier) {
    issues.push(`B: Tier is "${p.match_tier}" but "${hostInfo.retailer ?? p.retailer}" should be "${hostInfo.tier}"`);
  }

  // [C] URL in title
  if (/https?:\/\//i.test(title)) {
    issues.push("C: Title contains a URL");
  }

  // [D] Price in title
  if (/\$[\d]/.test(title) || /\b(USD|GBP|EUR)\b/i.test(title)) {
    issues.push("D: Title appears to contain a price");
  }

  // [E] All-caps title (at least 4 chars, all alpha chars uppercase)
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 4 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
    issues.push("E: Title is all-caps");
  }

  // [F] Bad price format
  if (p.price_display !== null && !VALID_PRICE_RE.test(p.price_display)) {
    issues.push(`F: Price format "${p.price_display}" is non-standard`);
  }

  // [J] Unmapped domain
  if (p.affiliate_url) {
    try {
      const host = new URL(p.affiliate_url).hostname.replace(/^www\./, "");
      const known = KNOWN_SITES.some((s) => host.includes(s.host));
      if (!known) {
        issues.push(`J: Unknown domain "${host}"`);
      }
    } catch {
      issues.push("J: Affiliate URL is malformed");
    }
  }

  return issues;
}

// ─── Rule metadata ────────────────────────────────────────────────────────────

const RULE_META: Record<string, { label: string; severity: "high" | "medium" | "low" }> = {
  A: { label: "Retailer label mismatch",   severity: "medium" },
  B: { label: "Tier mismatch",             severity: "high"   },
  C: { label: "URL in title",              severity: "high"   },
  D: { label: "Price in title",            severity: "high"   },
  E: { label: "All-caps title",            severity: "medium" },
  F: { label: "Non-standard price format", severity: "low"    },
  J: { label: "Unknown domain",            severity: "low"    },
};

const SEVERITY_COLOR: Record<"high" | "medium" | "low", string> = {
  high:   "bg-red-50 border-red-200 text-red-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  low:    "bg-sky-50 border-sky-200 text-sky-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DataQualityPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, title, retailer, network, match_tier, affiliate_url, price_display, image_url, look_id, looks(id, title)")
    .order("id");

  if (error) {
    return <p className="text-red-600 font-mono text-sm">Error: {error.message}</p>;
  }

  const products = (data ?? []) as unknown as RawProduct[];

  // Run all rules
  const flagged: FlaggedProduct[] = products
    .map((p) => ({ ...p, issues: detectIssues(p) }))
    .filter((p) => p.issues.length > 0);

  // Group by rule code (A, B, C, …)
  const byRule = new Map<string, FlaggedProduct[]>();
  for (const p of flagged) {
    for (const issue of p.issues) {
      const code = issue[0];
      if (!byRule.has(code)) byRule.set(code, []);
      byRule.get(code)!.push(p);
    }
  }

  // Deduplicate products with multiple issues under the same rule
  for (const [code, items] of byRule) {
    const seen = new Set<string>();
    byRule.set(code, items.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }));
  }

  const ruleOrder = ["B", "C", "D", "A", "E", "F", "J"];
  const totalFlagged = new Set(flagged.map((p) => p.id)).size;

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-brass tracking-[0.2em] uppercase text-xs mb-1">Admin</p>
          <h1 className="font-serif text-navy text-3xl">Data Quality</h1>
          <p className="text-navy/50 text-sm mt-2">
            {totalFlagged === 0
              ? `All ${products.length} products look clean.`
              : `${totalFlagged} of ${products.length} products have issues.`}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs tracking-widest uppercase text-navy/40 hover:text-navy transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {totalFlagged === 0 && (
        <div className="border border-green-200 bg-green-50 rounded p-8 text-center">
          <p className="text-green-700 font-serif text-xl mb-1">All clear</p>
          <p className="text-green-600 text-sm">No data quality issues detected.</p>
        </div>
      )}

      {/* Rule sections */}
      <div className="space-y-12">
        {ruleOrder
          .filter((code) => byRule.has(code))
          .map((code) => {
            const items = byRule.get(code)!;
            const meta = RULE_META[code] ?? { label: `Rule ${code}`, severity: "low" as const };
            return (
              <section key={code}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 border rounded ${SEVERITY_COLOR[meta.severity]}`}>
                    {code}
                  </span>
                  <h2 className="font-serif text-navy text-xl">{meta.label}</h2>
                  <span className="text-navy/30 text-sm">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Table */}
                <div className="border border-navy/10 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-navy/5 text-left text-xs tracking-widest uppercase text-navy/50">
                        <th className="px-4 py-2.5 font-normal">Title</th>
                        <th className="px-4 py-2.5 font-normal">Retailer</th>
                        <th className="px-4 py-2.5 font-normal">Tier</th>
                        <th className="px-4 py-2.5 font-normal">Issue</th>
                        <th className="px-4 py-2.5 font-normal">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {items.map((p) => {
                        const issueForCode = p.issues.find((i) => i[0] === code) ?? p.issues[0];
                        const lookId = p.look_id ?? p.looks?.id;
                        return (
                          <tr key={p.id} className="hover:bg-navy/2 transition-colors">
                            <td className="px-4 py-3 max-w-xs">
                              <p className="text-navy text-sm leading-snug line-clamp-2">
                                {p.title ?? <span className="italic text-navy/30">(no title)</span>}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-navy/60 whitespace-nowrap">
                              {p.retailer ?? <span className="italic text-navy/30">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-navy/5 px-1.5 py-0.5 rounded font-mono text-navy/60">
                                {p.match_tier ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-navy/50 text-xs max-w-sm">
                              {issueForCode.slice(3)}
                            </td>
                            <td className="px-4 py-3">
                              {lookId ? (
                                <Link
                                  href={`/admin/looks/${lookId}/products`}
                                  className="text-brass text-xs hover:underline whitespace-nowrap"
                                >
                                  Edit →
                                </Link>
                              ) : (
                                <span className="text-navy/20 text-xs">No look</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
      </div>

      {/* Footer note */}
      <div className="mt-16 border-t border-navy/10 pt-8">
        <p className="text-navy/30 text-xs leading-relaxed">
          Rules: <strong>B</strong> tier mismatch · <strong>C</strong> URL in title ·{" "}
          <strong>D</strong> price in title · <strong>A</strong> retailer label mismatch ·{" "}
          <strong>E</strong> all-caps title · <strong>F</strong> non-standard price ·{" "}
          <strong>J</strong> unknown domain.
          Each product links directly to its look&apos;s product editor for quick fixes.
        </p>
      </div>
    </div>
  );
}
