import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStarBySlug, getLookBySlug } from "@/lib/data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; lookSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lookSlug } = await params;
  const star = getStarBySlug(slug);
  if (!star) return {};
  const look = getLookBySlug(star.id, lookSlug);
  if (!look) return {};
  return {
    title: `${look.title} — ${star.name}`,
    description: look.editorialText.slice(0, 155),
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
  const star = getStarBySlug(slug);
  if (!star) notFound();

  const look = getLookBySlug(star.id, lookSlug);
  if (!look || !look.published) notFound();

  const sortedProducts = [...look.products].sort(
    (a, b) => a.displayOrder - b.displayOrder
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
              <Image
                src={look.imageUrl}
                alt={look.title}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <p className="text-warm-gray/60 text-xs mt-3 leading-relaxed">
              {look.imageCredit}{" "}
              <a
                href={look.imageSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-warm-gray transition-colors"
              >
                Source ↗
              </a>
            </p>
          </div>

          {/* Right: editorial + products */}
          <div>
            <p className="text-brass tracking-widest uppercase text-xs mb-4">
              {look.year}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-navy mb-8 leading-tight">
              {look.title}
            </h1>

            <div className="prose-custom text-navy/80 leading-relaxed mb-12 space-y-4">
              {look.editorialText.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Shop the look */}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-navy text-sm font-medium leading-snug mb-1">
                        {product.title}
                      </p>
                      <p className="text-warm-gray text-xs mb-3">
                        {product.priceDisplay}
                      </p>
                      <a
                        href={product.affiliateUrl}
                        rel="sponsored nofollow"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 bg-navy text-cream text-xs px-4 py-2 tracking-widest uppercase hover:bg-brass transition-colors"
                      >
                        Shop {networkLabel[product.network] ?? product.retailer}{" "}
                        ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
