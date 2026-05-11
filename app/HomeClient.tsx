"use client";

import { useState } from "react";
import Image from "next/image";

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string | null;
  price_display: string | null;
  affiliate_url: string;
  network: string;
  display_order: number;
};

type Look = {
  id: string;
  star_id: string;
  slug: string;
  title: string;
  year: number | null;
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

type SheetState =
  | { type: "closed" }
  | { type: "look"; star: Star; look: Look };

const networkLabel: Record<string, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  nordstrom: "Nordstrom",
  shareasale: "ShareASale",
  impact: "Impact",
  rakuten: "Rakuten",
  direct: "Shop",
};

export default function HomeClient({
  stars,
  looks,
}: {
  stars: Star[];
  looks: Look[];
}) {
  const [sheet, setSheet] = useState<SheetState>({ type: "closed" });

  function openLook(star: Star, look: Look) {
    setSheet({ type: "look", star, look });
  }

  function close() {
    setSheet({ type: "closed" });
  }

  const isOpen = sheet.type !== "closed";

  return (
    <>
      {/* Star sections */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 space-y-10 pt-6">
        {stars.map((star) => {
          const starLooks = looks
            .filter((l) => l.star_id === star.id)
            .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

          if (starLooks.length === 0) return null;

          return (
            <section key={star.id}>
              {/* Star header */}
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="font-serif text-navy text-xl md:text-2xl">{star.name}</h2>
                <div className="h-px flex-1 bg-navy/10" />
                <p className="text-brass text-xs tracking-widest uppercase shrink-0">
                  Tap to shop
                </p>
              </div>

              {/* Looks row */}
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-3 md:gap-4 w-max md:w-auto md:grid md:grid-cols-3 lg:grid-cols-4">
                  {starLooks.map((look) => (
                    <button
                      key={look.id}
                      onClick={() => openLook(star, look)}
                      className="group block text-left shrink-0 w-44 md:w-auto"
                    >
                      <div className="aspect-[3/4] relative overflow-hidden bg-navy/5 mb-2 rounded-sm">
                        {look.image_url && (
                          <Image
                            src={look.image_url}
                            alt={look.title}
                            fill
                            className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 176px, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-70 group-hover:opacity-30 transition-opacity duration-300" />
                        <p className="absolute bottom-2 left-2 text-cream text-xs font-mono">
                          {look.year}
                        </p>
                        <div className="absolute inset-0 border border-brass/0 group-hover:border-brass/50 transition-colors duration-300 rounded-sm" />
                      </div>
                      <p className="font-serif text-navy text-sm leading-snug group-hover:text-brass transition-colors">
                        {look.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 bg-navy/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Bottom sheet — look detail only */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[88vh] bg-cream rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-navy/20" />
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          {sheet.type === "look" && (
            <LookView
              star={sheet.star}
              look={sheet.look}
              onClose={close}
            />
          )}
        </div>
      </div>
    </>
  );
}

function LookView({
  star,
  look,
  onClose,
}: {
  star: Star;
  look: Look;
  onClose: () => void;
}) {
  const sortedProducts = [...(look.products ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <p className="text-xs text-navy/40 tracking-widest uppercase">{star.name}</p>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-navy/30 hover:text-navy transition-colors text-3xl leading-none px-1"
        >
          ×
        </button>
      </div>

      {/* Look image */}
      {look.image_url && (
        <div className="aspect-[4/3] relative overflow-hidden mx-5 mb-5 rounded-sm">
          <Image
            src={look.image_url}
            alt={look.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 90vw, 560px"
          />
        </div>
      )}

      {/* Title */}
      <div className="px-5 mb-4">
        <p className="text-brass text-xs tracking-[0.2em] uppercase mb-1">{look.year}</p>
        <h2 className="font-serif text-navy text-2xl leading-snug">{look.title}</h2>
      </div>

      {/* Editorial */}
      {look.editorial_text && (
        <p className="px-5 text-navy/70 text-sm leading-relaxed mb-6">
          {look.editorial_text}
        </p>
      )}

      {/* Products */}
      {sortedProducts.length > 0 && (
        <div className="px-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-navy/10" />
            <p className="text-xs tracking-[0.2em] uppercase text-navy/40">Shop the Look</p>
            <div className="h-px flex-1 bg-navy/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sortedProducts.map((product) => (
              <div key={product.id} className="bg-warm-white border border-navy/8">
                <div className="aspect-square overflow-hidden bg-navy/5">
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

          {look.image_credit && (
            <p className="text-navy/30 text-xs mt-5 leading-relaxed">
              {look.image_credit}
              {look.image_source_url && (
                <>
                  {" "}
                  <a
                    href={look.image_source_url}
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
  );
}
