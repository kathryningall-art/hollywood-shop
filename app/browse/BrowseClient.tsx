"use client";

import { useState, useMemo } from "react";
import type { MatchTier } from "@/app/components/ProductFrame";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrowseProduct = {
  id: string;
  title: string;
  retailer: string;
  image_url: string | null;
  price_display: string | null;
  size: string | null;
  affiliate_url: string;
  network: string;
  match_tier: MatchTier;
  look: {
    id: string;
    title: string;
    year: number | null;
    year_display: string | null;
    image_url: string | null;
    slug: string;
  };
  star: {
    id: string;
    name: string;
    slug: string;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_FILTERS: { value: "all" | MatchTier; label: string }[] = [
  { value: "all",                 label: "All" },
  { value: "original_era",        label: "Antique" },
  { value: "vintage_pre_owned",   label: "Pre-Owned" },
  { value: "vintage_reproduction",label: "Reproduction" },
  { value: "modern_inspired",     label: "Modern" },
];

type PriceBucket = {
  key: string;
  label: string;
  test: (price: number | null) => boolean;
};

const PRICE_FILTERS: PriceBucket[] = [
  { key: "any",     label: "Any Price",   test: () => true },
  { key: "u50",     label: "Under $50",   test: (p) => p !== null && p < 50 },
  { key: "50-150",  label: "$50 – $150",  test: (p) => p !== null && p >= 50 && p <= 150 },
  { key: "150-300", label: "$150 – $300", test: (p) => p !== null && p > 150 && p <= 300 },
  { key: "300plus", label: "$300+",       test: (p) => p !== null && p > 300 },
];

const NETWORK_LABEL: Record<string, string> = {
  etsy:       "Etsy",
  amazon:     "Amazon",
  nordstrom:  "Nordstrom",
  shareasale: "ShareASale",
  impact:     "Impact",
  rakuten:    "Rakuten",
};

const TIER_LABEL: Record<MatchTier, string> = {
  original_era:         "Antique",
  vintage_pre_owned:    "Pre-Owned",
  vintage_reproduction: "Reproduction",
  modern_inspired:      "Modern",
};

// Left-border accent color per tier
const TIER_ACCENT: Record<MatchTier, string> = {
  original_era:         "border-[#B89752] text-[#B89752]",
  vintage_pre_owned:    "border-[#8B6F47] text-[#8B6F47]",
  vintage_reproduction: "border-[#735834] text-[#735834]",
  modern_inspired:      "border-navy/40 text-navy/50",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(display: string | null): number | null {
  if (!display) return null;
  const match = display.match(/[\d,]+/);
  return match ? parseInt(match[0].replace(/,/g, ""), 10) : null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BrowseClient({ products }: { products: BrowseProduct[] }) {
  const [keyword, setKeyword] = useState("");
  const [tier, setTier] = useState<"all" | MatchTier>("all");
  const [priceKey, setPriceKey] = useState("any");
  const [sizeFilter, setSizeFilter] = useState("all");

  // Unique sizes that actually appear in the data
  const uniqueSizes = useMemo(() => {
    const seen = new Set<string>();
    products.forEach((p) => { if (p.size) seen.add(p.size); });
    return [...seen].sort();
  }, [products]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const priceBucket = PRICE_FILTERS.find((b) => b.key === priceKey) ?? PRICE_FILTERS[0];

    return products.filter((p) => {
      // Keyword: search title, retailer, look title, star name
      if (kw) {
        const hay = [p.title, p.retailer, p.look.title, p.star.name].join(" ").toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      // Tier
      if (tier !== "all" && p.match_tier !== tier) return false;
      // Price
      if (!priceBucket.test(parsePrice(p.price_display))) return false;
      // Size
      if (sizeFilter === "has_size" && !p.size) return false;
      if (sizeFilter !== "all" && sizeFilter !== "has_size" && p.size !== sizeFilter) return false;

      return true;
    });
  }, [products, keyword, tier, priceKey, sizeFilter]);

  const isFiltered = filtered.length !== products.length;

  // ── Clear all
  function clearAll() {
    setKeyword("");
    setTier("all");
    setPriceKey("any");
    setSizeFilter("all");
  }

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-navy/10 bg-cream px-6 py-5">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Keyword search */}
          <div className="relative max-w-lg">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30 text-base pointer-events-none select-none">
              ⌕
            </span>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by product, star, or style keyword…"
              className="w-full border border-navy/20 pl-9 pr-4 py-2.5 text-navy text-sm focus:outline-none focus:border-brass bg-white placeholder:text-navy/30"
            />
          </div>

          {/* Tier · Price · Size row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Tier pills */}
            {TIER_FILTERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTier(t.value)}
                className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                  tier === t.value
                    ? "bg-navy text-cream border-navy"
                    : "text-navy/60 border-navy/20 hover:border-navy/50 hover:text-navy bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Divider */}
            <span className="h-4 w-px bg-navy/15 mx-1" />

            {/* Price dropdown */}
            <select
              value={priceKey}
              onChange={(e) => setPriceKey(e.target.value)}
              className="text-xs tracking-widest uppercase border border-navy/20 px-3 py-1.5 text-navy/70 bg-white focus:outline-none focus:border-brass hover:border-navy/50 cursor-pointer"
            >
              {PRICE_FILTERS.map((b) => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>

            {/* Size dropdown — only shown when at least one product has a size */}
            {uniqueSizes.length > 0 && (
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="text-xs tracking-widest uppercase border border-navy/20 px-3 py-1.5 text-navy/70 bg-white focus:outline-none focus:border-brass hover:border-navy/50 cursor-pointer"
              >
                <option value="all">All Sizes</option>
                <option value="has_size">Has Size Listed</option>
                {uniqueSizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* Clear filters — only when something is active */}
            {isFiltered && (
              <button
                onClick={clearAll}
                className="text-xs tracking-widest uppercase text-navy/40 hover:text-navy underline underline-offset-2 transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-navy/40 text-xs tracking-wide">
            {isFiltered
              ? `${filtered.length} of ${products.length} products`
              : `${products.length} products`}
          </p>
        </div>
      </div>

      {/* ── Product grid ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-navy/40 text-2xl mb-2">No results</p>
            <p className="text-navy/30 text-sm">Try broadening your filters or clearing the search.</p>
            <button
              onClick={clearAll}
              className="mt-6 text-xs tracking-widest uppercase text-brass hover:text-navy transition-colors underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product: p }: { product: BrowseProduct }) {
  const retailerName = NETWORK_LABEL[p.network] ?? p.retailer;
  const tierLabel = TIER_LABEL[p.match_tier];
  const tierAccent = TIER_ACCENT[p.match_tier];
  const yearDisplay = p.look.year_display ?? p.look.year ?? null;

  return (
    <div className="flex flex-col bg-white border border-navy/10 hover:border-navy/25 transition-colors">
      {/* Product image */}
      <div className="aspect-square bg-cream/60 overflow-hidden flex-shrink-0">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif italic text-navy/15 text-4xl">B</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {/* Tier badge */}
        <span className={`text-[10px] tracking-widest uppercase border-l-2 pl-1.5 leading-none ${tierAccent}`}>
          {tierLabel}
        </span>

        {/* Title */}
        <p className="text-navy text-sm font-medium leading-snug line-clamp-2">
          {p.title}
        </p>

        {/* Retailer · price · size */}
        <p className="text-navy/50 text-xs leading-relaxed">
          {retailerName}
          {p.price_display && <> · {p.price_display}</>}
          {p.size && <> · <span className="font-medium">Size {p.size}</span></>}
        </p>

        {/* Look context */}
        <div className="mt-auto pt-2.5 border-t border-navy/10 flex items-center gap-2">
          {p.look.image_url && (
            <img
              src={p.look.image_url}
              alt={p.look.title}
              className="w-7 h-7 object-cover flex-shrink-0 opacity-60 grayscale"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <p className="text-[10px] text-navy/50 leading-tight truncate">{p.star.name}</p>
            <p className="text-[10px] text-navy/35 leading-tight truncate italic">
              {p.look.title}{yearDisplay ? `, ${yearDisplay}` : ""}
            </p>
          </div>
        </div>

        {/* CTA */}
        <a
          href={p.affiliate_url}
          target="_blank"
          rel="sponsored nofollow noreferrer"
          className="mt-2 block text-center text-[10px] tracking-widest uppercase bg-navy text-cream py-2 hover:bg-brass transition-colors"
        >
          Shop {retailerName} ↗
        </a>
      </div>
    </div>
  );
}
