import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { buildOpenGraph, buildTwitter, truncate } from "@/lib/og";

interface Props {
  params: Promise<{ slug: string; lookSlug: string }>;
}

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

const networkLabel: Record<string, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  nordstrom: "Nordstrom",
  shareasale: "ShareASale",
  impact: "Impact",
  rakuten: "Rakuten",
  direct: "Shop",
};

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
      id, title, year, image_url, image_credit, image_source_url,
      editorial_text, published,
      products (id, title, retailer, image_url, price_display, affiliate_url, network, display_order)
    `)
    .eq("star_id", star.id)
    .eq("slug", lookSlug)
    .eq("published", true)
    .single();

  if (!look) notFound();

  const sortedProducts = [...(look.products ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

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
          {/* Left: image */}
          <div>
            <div className="aspect-[3/4] relative overflow-hidden bg-navy/5">
              {look.image_url && (
                <Image
                  src={look.image_url}
                  alt={look.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
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
              {look.year}
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
            {sortedProducts.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl text-navy mb-6 pb-3 border-b border-navy/10">
                  Shop the Look
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-warm-white border border-navy/8 group"
                    >
                      <div className="aspect-square overflow-hidden bg-navy/5">
                        {product.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-navy text-sm font-medium leading-snug mb-1">
                          {product.title}
                        </p>
                        <p className="text-warm-gray text-xs mb-3">
                          {product.price_display}
                        </p>
                        <a
                          href={product.affiliate_url}
                          rel="sponsored nofollow"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-navy text-cream text-xs px-4 py-2 tracking-widest uppercase hover:bg-brass transition-colors"
                        >
                          Shop {networkLabel[product.network] ?? product.retailer} ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Back to star */}
      <div className="border-t border-navy/10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href={`/stars/${star.slug}`}
            className="text-warm-gray hover:text-navy transition-colors text-sm tracking-widest uppercase"
          >
            ← More looks from {star.name}
          </Link>
        </div>
      </div>
    </>
  );
}
