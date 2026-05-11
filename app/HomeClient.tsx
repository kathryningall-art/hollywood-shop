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
  | { type: "star"; star: Star; looks: Look[] }
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

  function openStar(star: Star) {
    const starLooks = looks
      .filter((l) => l.star_id === star.id)
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    setSheet({ type: "star", star, looks: starLooks });
  }

  function openLook(star: Star, look: Look) {
    setSheet({ type: "look", star, look });
  }

  function close() {
    setSheet({ type: "closed" });
  }

  const isOpen = sheet.type !== "closed";

  return (
    <>
      {/* Star grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 px-4 md:px-6 pb-16 max-w-6xl mx-auto">
        {stars.map((star) => (
          <button
            key={star.id}
            onClick={() => openStar(star)}
            className="group block text-left"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-navy/5 portrait-frame mb-3">
              {star.hero_image_url && (
                <Image
                  src={star.hero_image_url}
                  alt={star.name}
                  fill
                  className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent opacity-80 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <p className="font-serif text-cream text-sm md:text-base leading-tight drop-shadow">
                  {star.name}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 bg-navy/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[88vh] bg-cream rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-navy/20" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {sheet.type === "star" && (
            <StarView
              star={sheet.star}
              looks={sheet.looks}
              onLookSelect={(look) => openLook(sheet.star, look)}
              onClose={close}
            />
          )}
          {sheet.type === "look" && (
            <LookView
              star={sheet.star}
              look={sheet.look}
              onBack={() => openStar(sheet.star)}
              onClose={close}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StarView({
  star,
  looks,
  onLookSelect,
  onClose,
}: {
  star: Star;
  looks: Look[];
  onLookSelect: (look: Look) => void;
  onClose: () => void;
}) {
  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-2 pb-5">
        <div>
          <p className="text-brass tracking-[0.2em] uppercase text-xs mb-1">Collection</p>
          <h2 className="font-serif text-navy text-3xl leading-tight">{star.name}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-navy/30 hover:text-navy transition-colors text-3xl leading-none mt-1 px-1"
        >
          ×
        </button>
      </div>

      {/* Bio */}
      {star.bio && (
        <p className="px-5 text-navy/70 text-sm leading-relaxed mb-7">
          {star.bio}
        </p>
      )}

      {/* Ornament divider */}
      <div className="px-5 mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-navy/10" />
        <span className="text-brass text-xs">◆</span>
        <div className="h-px flex-1 bg-navy/10" />
      </div>

      {/* Looks filmstrip */}
      {looks.length > 0 ? (
        <div>
          <p className="px-5 text-xs tracking-[0.2em] uppercase text-navy/40 mb-4">
            The Looks — tap to shop
          </p>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 px-5 w-max">
              {looks.map((look) => (
                <button
                  key={look.id}
                  onClick={() => onLookSelect(look)}
                  className="group block text-left shrink-0 w-36 md:w-44"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-navy/10 mb-2 rounded-sm">
                    {look.image_url && (
                      <Image
                        src={look.image_url}
                        alt={look.title}
                        fill
                        className="object-cover object-top brightness-90 group-hover:brightness-100 transition-all duration-300"
                        sizes="180px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-cream text-xs font-mono">
                      {look.year}
                    </p>
                    <div className="absolute inset-0 border border-brass/0 group-hover:border-brass/60 transition-colors duration-300 rounded-sm" />
                  </div>
                  <p className="font-serif text-navy text-sm leading-snug group-hover:text-brass transition-colors">
                    {look.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="px-5 text-navy/40 text-sm italic">No looks published yet.</p>
      )}
    </div>
  );
}

function LookView({
  star,
  look,
  onBack,
  onClose,
}: {
  star: Star;
  look: Look;
  onBack: () => void;
  onClose: () => void;
}) {
  const sortedProducts = [...(look.products ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <button
          onClick={onBack}
          className="text-xs text-brass tracking-[0.15em] uppercase hover:text-navy transition-colors"
        >
          ← {star.name}
        </button>
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
                    <div className="w-full h-full bg-navy/5 flex items-center justify-center">
                      <span className="text-navy/20 text-xs">No image</span>
                    </div>
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
