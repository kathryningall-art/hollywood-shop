"use client";

import { useState } from "react";
import Image from "next/image";
import ProductFrame, { type MatchTier } from "@/app/components/ProductFrame";

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string | null;
  price_display: string | null;
  affiliate_url: string;
  network: string;
  display_order: number;
  match_tier: MatchTier;
};

type Look = {
  id: string;
  star_id: string;
  slug: string;
  title: string;
  year: number | null;
  display_order: number;
  image_url: string | null;
  image_credit: string | null;
  image_source_url: string | null;
  editorial_text: string | null;
  products: Product[];
};

type Star = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  hero_image_url: string | null;
};

const networkLabel: Record<string, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  nordstrom: "Nordstrom",
  shareasale: "ShareASale",
  impact: "Impact",
  rakuten: "Rakuten",
  direct: "Shop",
};

const TIER_CONFIG: { key: MatchTier; label: string; desc: string }[] = [
  { key: "original_era",         label: "Original Era",          desc: "Genuine vintage pieces from this era" },
  { key: "vintage_reproduction", label: "Vintage Reproduction",  desc: "Made today in period style" },
  { key: "modern_inspired",      label: "Modern Inspired",        desc: "Contemporary pieces inspired by the look" },
];

export default function HomeClient({
  stars,
  looks,
}: {
  stars: Star[];
  looks: Look[];
}) {
  const [expandedLookId, setExpandedLookId] = useState<string | null>(null);

  function toggleLook(lookId: string) {
    setExpandedLookId((prev) => (prev === lookId ? null : lookId));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 space-y-10 pt-6">
      {stars.map((star) => {
        const starLooks = looks
          .filter((l) => l.star_id === star.id)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

        if (starLooks.length === 0) return null;

        const expandedLook = starLooks.find((l) => l.id === expandedLookId);

        return (
          <section key={star.id}>
            {/* Star header */}
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-serif text-navy text-xl md:text-2xl">{star.name}</h2>
              <div className="h-px flex-1 bg-navy/10" />
            </div>

            {/* Look cards — horizontal filmstrip on all screen sizes */}
            <div className="overflow-x-auto -mx-4 px-4 mb-1">
              <div className="flex gap-3 w-max pb-2">
                {starLooks.map((look) => {
                  const isActive = expandedLookId === look.id;
                  return (
                    <button
                      key={look.id}
                      onClick={() => toggleLook(look.id)}
                      className="group block text-left shrink-0 w-44 md:w-52"
                    >
                      <div
                        className={`aspect-[3/4] relative overflow-hidden mb-2 rounded-sm transition-all duration-300 ${
                          isActive
                            ? "ring-2 ring-brass ring-offset-1"
                            : "ring-0"
                        }`}
                      >
                        {look.image_url && (
                          <Image
                            src={look.image_url}
                            alt={look.title}
                            fill
                            className={`object-cover object-top transition-all duration-500 ${
                              isActive
                                ? "grayscale-0 scale-[1.03]"
                                : "grayscale group-hover:grayscale-0 group-hover:scale-[1.03]"
                            }`}
                            sizes="(max-width: 640px) 176px, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent transition-opacity duration-300 ${
                            isActive ? "opacity-20" : "opacity-70 group-hover:opacity-20"
                          }`}
                        />
                        <p className="absolute bottom-2 left-2 text-cream text-xs font-mono drop-shadow">
                          {look.year}
                        </p>
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-brass text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center leading-none">
                            ×
                          </div>
                        )}
                      </div>
                      <p
                        className={`font-serif text-sm leading-snug transition-colors ${
                          isActive ? "text-brass" : "text-navy group-hover:text-brass"
                        }`}
                      >
                        {look.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline product expansion */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedLook ? "max-h-[4000px] opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              {expandedLook && (
                <div className="border-t border-brass/30 pt-5">
                  <div className="flex items-baseline gap-2 mb-6">
                    <p className="text-brass text-xs tracking-widest uppercase">
                      {expandedLook.year}
                    </p>
                    <span className="text-navy/20">·</span>
                    <p className="font-serif text-navy text-base">{expandedLook.title}</p>
                  </div>

                  {TIER_CONFIG.map(({ key, label, desc }) => {
                    const tierProducts = [...(expandedLook.products ?? [])]
                      .filter((p) => (p.match_tier ?? "modern_inspired") === key)
                      .sort((a, b) => a.display_order - b.display_order);

                    if (tierProducts.length === 0) return null;

                    return (
                      <div key={key} className="mb-8">
                        {/* Tier heading */}
                        <div className="mb-3">
                          <p
                            className="font-serif uppercase tracking-[0.12em] leading-none"
                            style={{ fontSize: 13, color: "#6B5B3F" }}
                          >
                            {label}
                          </p>
                          <p
                            className="italic mt-0.5"
                            style={{ fontSize: 13, color: "#9C8B70", fontWeight: 400, lineHeight: 1.4 }}
                          >
                            {desc}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {tierProducts.map((product) => (
                            <div key={product.id} className="bg-warm-white">
                              <ProductFrame tier={product.match_tier}>
                                <div className="aspect-square overflow-hidden image-wrapper">
                                  {product.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={product.image_url}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-navy/5" />
                                  )}
                                </div>
                              </ProductFrame>
                              <div className="p-3">
                                <p className="text-navy text-xs font-medium leading-snug mb-1 line-clamp-2">
                                  {product.title}
                                </p>
                                {product.price_display && (
                                  <p className="text-navy/50 text-xs mb-2">{product.price_display}</p>
                                )}
                                <a
                                  href={product.affiliate_url}
                                  rel="sponsored nofollow"
                                  target="_blank"
                                  className="block text-center bg-navy text-cream text-xs py-2 tracking-widest uppercase hover:bg-brass transition-colors"
                                >
                                  Shop {networkLabel[product.network] ?? product.retailer} ↗
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {expandedLook.image_credit && (
                    <p className="text-navy/30 text-xs mt-2 leading-relaxed">
                      {expandedLook.image_credit}
                      {expandedLook.image_source_url && (
                        <>
                          {" "}
                          <a
                            href={expandedLook.image_source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-navy/50 transition-colors"
                          >
                            Source ↗
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
