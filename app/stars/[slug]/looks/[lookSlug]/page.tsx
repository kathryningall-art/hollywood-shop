import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { buildOpenGraph, buildTwitter, truncate, buildPinDescription } from "@/lib/og";
import PinSaveButton from "@/app/components/PinSaveButton";
import type { MatchTier } from "@/app/components/ProductFrame";

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
  direct: "Shop",
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

interface Props {
  params: Promise<{ slug: string; lookSlug: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lookSlug } = await params;
  const supabase = await createClient();
  const { data: star } = await supabase
    .from("stars")
    .select("id, name")
    .eq("slug", slug)
    .single();
  if (!star) return {};
  const { data: look } = await supabase
    .from("looks")
    .select("title, editorial_text, image_url")
    .eq("star_id", star.id)
    .eq("slug", lookSlug)
    .single();
  if (!look) return {};

  const ogTitle = `${look.title} — ${star.name} · Bias Cut Bureau`;
  const ogDescription = truncate(look.editorial_text, 200);

  return {
    title: `${look.title} — ${star.name}`,
    description: look.editorial_text?.slice(0, 155) ?? "",
    openGraph: buildOpenGraph({
      title: ogTitle,
      description: ogDescription,
      image: look.image_url,
      path: `/stars/${slug}/looks/${lookSlug}`,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description: ogDescription,
      image: look.image_url,
    }),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LookPage({ params }: Props) {
  const { slug, lookSlug } = await params;
  const supabase = await createClient();

  const { data: star } = await supabase
    .from("stars")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!star) notFound();

  const { data: look } = await supabase
    .from("looks")
    .select(`
      id, title, year, year_display, image_url, image_credit, image_source_url,
      editorial_text, published,
      products (id, title, retailer, image_url, price_display, size, affiliate_url, network, match_tier, display_order)
    `)
    .eq("star_id", star.id)
    .eq("slug", lookSlug)
    .eq("published", true)
    .single();

  if (!look) notFound();

  const products = ((look.products ?? []) as unknown as Product[])
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

  return (
    <>
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-6 pt-8 pb-0">
        <p className="text-warm-gray text-sm">
          <Link href="/" className="hover:text-navy transition-colors">
            Collections
          </Link>
          <span className="mx-2 text-warm-gray/40">/</span>
          <Link
            href={`/stars/${star.slug}`}
            className="hover:text-navy transition-colors"
          >
            {star.name}
          </Link>
          <span className="mx-2 text-warm-gray/40">/</span>
          <span className="text-navy">{look.title}</span>
        </p>
      </nav>

      {/* Look hero */}
      <article className="max-w-6xl mx-auto px-6 pt-10 pb-16 md:pb-24">
        <div className="grid md:grid-cols-[1fr_1fr] lg:grid-cols-[5fr_6fr] gap-12 lg:gap-20 items-start">
          {/* Left: image (sticky on desktop so it stays visible as products scroll) */}
          <div className="md:sticky md:top-8">
            <div className="aspect-[3/4] relative overflow-hidden bg-navy/5">
              {look.image_url && (
                <>
                  <Image
                    src={look.image_url}
                    alt={look.title}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <PinSaveButton
                    pageUrl={`/stars/${star.slug}/looks/${lookSlug}`}
                    mediaUrl={look.image_url}
                    description={buildPinDescription({
                      lookTitle: look.title,
                      starName: star.name,
                      editorialText: look.editorial_text,
                      year: look.year,
                    })}
                  />
                </>
              )}
            </div>
            <p className="text-warm-gray/60 text-xs mt-3 leading-relaxed">
              {look.image_credit}{" "}
              {look.image_source_url && (
                <a
                  href={look.image_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-warm-gray transition-colors"
                >
                  Source ↗
                </a>
              )}
            </p>
          </div>

          {/* Right: editorial + products */}
          <div>
            <p className="font-sc text-brass tracking-widest uppercase text-xs mb-4">
              {look.year_display ?? look.year}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-navy mb-8 leading-tight">
              {look.title}
            </h1>

            <div className="prose-custom text-navy/80 leading-relaxed mb-12 space-y-4">
              {look.editorial_text?.split("\n").map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Shop the look */}
            {products.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl text-navy mb-6 pb-3 border-b border-navy/10">
                  Shop the Look
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            )}
          </div>
        </div>

        {/* More looks by this star */}
        {siblingLooks.length > 0 && (
          <section className="mt-20">
            <div className="ornament-divider text-brass text-xs mb-8">◆</div>
            <p className="text-xs tracking-widest uppercase text-navy/40 mb-6">
              More looks by {star.name}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {siblingLooks.map((s) => (
                <Link
                  key={s.id}
                  href={`/stars/${star.slug}/looks/${s.slug}`}
                  className="group block border border-navy/10 hover:border-navy/25 transition-colors bg-white"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-cream/50">
                    {s.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
      </article>
    </>
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
          // eslint-disable-next-line @next/next/no-img-element
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
