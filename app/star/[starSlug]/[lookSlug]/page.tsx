import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MatchTier } from "@/app/components/ProductFrame";
import { buildOpenGraph, buildTwitter, truncate, buildPinDescription } from "@/lib/og";
import PinSaveButton from "@/app/components/PinSaveButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string | null;
  price_display: string | null;
  size: string | null;
  affiliate_url: string;
  network: string;
  match_tier: MatchTier;
  display_order: number;
};

type Look = {
  id: string;
  title: string;
  year: number | null;
  year_display: string | null;
  editorial_text: string | null;
  image_url: string | null;
  image_credit: string | null;
  image_source_url: string | null;
  slug: string;
  products: Product[];
  stars: {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    hero_image_url: string | null;
  };
};

type SiblingLook = {
  id: string;
  title: string;
  year: number | null;
  year_display: string | null;
  image_url: string | null;
  slug: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORK_LABEL: Record<string, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  nordstrom: "Nordstrom",
  shareasale: "ShareASale",
  impact: "Impact",
  rakuten: "Rakuten",
};

const TIER_LABEL: Record<MatchTier, string> = {
  vintage:      "Vintage",
  pre_owned:    "Pre-Owned",
  reproduction: "Reproduction",
  modern:       "Modern",
};

const TIER_ACCENT: Record<MatchTier, string> = {
  vintage:      "border-[#B89752] text-[#B89752]",
  pre_owned:    "border-[#8B6F47] text-[#8B6F47]",
  reproduction: "border-[#735834] text-[#735834]",
  modern:       "border-navy/40 text-navy/50",
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ starSlug: string; lookSlug: string }>;
}): Promise<Metadata> {
  const { starSlug, lookSlug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("looks")
    .select("title, editorial_text, image_url, stars(name)")
    .eq("slug", lookSlug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Look Not Found" };

  const star = data.stars as unknown as { name: string } | null;
  const description =
    data.editorial_text?.slice(0, 160) ??
    `Shop the look of ${star?.name ?? "a classic Hollywood star"}.`;

  const ogTitle = `${data.title}${star ? ` — ${star.name}` : ""} · Bias Cut Bureau`;
  const ogDescription = truncate(data.editorial_text, 200);

  return {
    title: `${data.title}${star ? ` — ${star.name}` : ""}`,
    description,
    openGraph: buildOpenGraph({
      title: ogTitle,
      description: ogDescription,
      image: data.image_url,
      path: `/star/${starSlug}/${lookSlug}`,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description: ogDescription,
      image: data.image_url,
    }),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LookPage({
  params,
}: {
  params: Promise<{ starSlug: string; lookSlug: string }>;
}) {
  const { starSlug, lookSlug } = await params;
  const supabase = await createClient();

  // Fetch the look with products and star
  const { data: look } = await supabase
    .from("looks")
    .select(`
      id, title, year, year_display, editorial_text,
      image_url, image_credit, image_source_url, slug,
      stars(id, name, slug, bio, hero_image_url),
      products(id, title, retailer, image_url, price_display, size, affiliate_url, network, match_tier, display_order)
    `)
    .eq("slug", lookSlug)
    .eq("published", true)
    .single();

  if (!look) notFound();

  const star = look.stars as unknown as Look["stars"] | null;
  if (!star || star.slug !== starSlug) notFound();

  // Sort products by display_order
  const products = (look.products as unknown as Product[])
    .slice()
    .sort((a, b) => a.display_order - b.display_order);

  // Fetch sibling looks by the same star (excluding this one)
  const { data: siblings } = await supabase
    .from("looks")
    .select("id, title, year, year_display, image_url, slug")
    .eq("star_id", star.id)
    .eq("published", true)
    .neq("id", look.id)
    .order("display_order");

  const siblingLooks = (siblings ?? []) as SiblingLook[];
  const yearDisplay = look.year_display ?? look.year ?? null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-xs tracking-widest uppercase text-navy/40">
        <Link href="/" className="hover:text-brass transition-colors">Collections</Link>
        <span>·</span>
        <span className="text-navy/60">{star.name}</span>
      </div>

      {/* Look header */}
      <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">{star.name}</p>
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-1 leading-snug">
        {look.title}
      </h1>
      {yearDisplay && (
        <p className="text-navy/40 text-sm tracking-wide mb-8">{yearDisplay}</p>
      )}

      {/* Look image */}
      {look.image_url && (
        <div className="mb-6">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={look.image_url}
              alt={`${star.name} — ${look.title}`}
              className="w-full h-auto"
            />
            <PinSaveButton
              pageUrl={`/star/${starSlug}/${lookSlug}`}
              mediaUrl={look.image_url}
              description={buildPinDescription({
                lookTitle: look.title,
                starName: star.name,
                editorialText: look.editorial_text,
                year: look.year,
              })}
            />
          </div>
          {(look.image_credit || look.image_source_url) && (
            <p className="text-navy/30 text-[10px] mt-1.5 tracking-wide">
              {look.image_source_url ? (
                <a
                  href={look.image_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-navy/60 transition-colors underline underline-offset-2"
                >
                  {look.image_credit ?? "Source ↗"}
                </a>
              ) : (
                look.image_credit
              )}
            </p>
          )}
        </div>
      )}

      {/* Editorial text */}
      {look.editorial_text && (
        <div className="mb-12">
          <p className="text-navy/70 leading-relaxed md:text-lg">{look.editorial_text}</p>
        </div>
      )}

      <div className="ornament-divider text-brass text-xs mb-10">◆</div>

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-16">
          <p className="text-xs tracking-widest uppercase text-navy/40 mb-6">Shop the Look</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <p className="mt-6 text-navy/30 text-xs leading-relaxed">
            Links marked ↗ are affiliate links.{" "}
            <Link href="/about/our-picks" className="underline underline-offset-2 hover:text-navy/50 transition-colors">
              About our picks
            </Link>
          </p>
        </section>
      )}

      {/* More looks by this star */}
      {siblingLooks.length > 0 && (
        <section>
          <div className="ornament-divider text-brass text-xs mb-8">◆</div>
          <p className="text-xs tracking-widest uppercase text-navy/40 mb-6">
            More looks by {star.name}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {siblingLooks.map((s) => (
              <Link
                key={s.id}
                href={`/star/${starSlug}/${s.slug}`}
                className="group block border border-navy/10 hover:border-navy/25 transition-colors bg-white"
              >
                <div className="aspect-[3/4] overflow-hidden bg-cream/50">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif italic text-navy/15 text-3xl">B</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-navy text-sm font-medium leading-snug line-clamp-2">{s.title}</p>
                  {(s.year_display ?? s.year) && (
                    <p className="text-navy/40 text-xs mt-0.5">{s.year_display ?? s.year}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product: p }: { product: Product }) {
  const retailerName = NETWORK_LABEL[p.network] ?? p.retailer;
  const tierLabel = TIER_LABEL[p.match_tier];
  const tierAccent = TIER_ACCENT[p.match_tier];

  return (
    <div className="flex flex-col bg-white border border-navy/10 hover:border-navy/25 transition-colors">
      {/* Image */}
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
            <span className="font-serif italic text-navy/15 text-3xl">B</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <span className={`text-[10px] tracking-widest uppercase border-l-2 pl-1.5 leading-none ${tierAccent}`}>
          {tierLabel}
        </span>
        <p className="text-navy text-sm font-medium leading-snug">{p.title}</p>
        <p className="text-navy/50 text-xs">
          {retailerName}
          {p.price_display && <> · {p.price_display}</>}
          {p.size && <> · <span className="font-medium">Size {p.size}</span></>}
        </p>
        <a
          href={p.affiliate_url}
          target="_blank"
          rel="sponsored nofollow noreferrer"
          className="mt-auto block text-center text-[10px] tracking-widest uppercase bg-navy text-cream py-2 hover:bg-brass transition-colors"
        >
          Shop {retailerName} ↗
        </a>
      </div>
    </div>
  );
}
