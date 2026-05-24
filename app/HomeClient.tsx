"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductFrame, { type MatchTier } from "@/app/components/ProductFrame";

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string | null;
  price_display: string | null;
  size: string | null;
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
  year_display: string | null;
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
};

const TIER_ORDER: Record<MatchTier, number> = {
  vintage: 0,
  pre_owned: 1,
  reproduction: 2,
  modern: 3,
};

const TIER_SHORT: Record<MatchTier, string> = {
  vintage: "Vintage",
  pre_owned: "Pre-Owned",
  reproduction: "Reproduction",
  modern: "Modern",
};

function sortedProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const ta = TIER_ORDER[a.match_tier ?? "modern"];
    const tb = TIER_ORDER[b.match_tier ?? "modern"];
    if (ta !== tb) return ta - tb;
    return a.display_order - b.display_order;
  });
}

export default function HomeClient({
  stars,
  looks,
}: {
  stars: Star[];
  looks: Look[];
}) {
  const [expandedLookId, setExpandedLookId] = useState<string | null>(null);
  const [stripDismissed, setStripDismissed] = useState(false);
  const [productsInView, setProductsInView] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [visibleStarId, setVisibleStarId] = useState<string | null>(null);
  const [thumbsVisible, setThumbsVisible] = useState(true);
  const [hoveredLookId, setHoveredLookId] = useState<string | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Reset strip state whenever the active look changes; seed the active thumbnail.
  // Fade thumbnails out then back in so the content switch isn't jarring.
  useEffect(() => {
    setStripDismissed(false);
    setProductsInView(false);
    setThumbsVisible(false);
    const t = setTimeout(() => {
      if (expandedLookId) {
        const look = looks.find((l) => l.id === expandedLookId);
        const first = look ? sortedProducts(look.products)[0] : null;
        setActiveProductId(first?.id ?? null);
      } else {
        setActiveProductId(null);
      }
      setThumbsVisible(true);
    }, 280);
    return () => clearTimeout(t);
  }, [expandedLookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch the products container; fade the strip out when it scrolls into view
  useEffect(() => {
    const el = productsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setProductsInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [expandedLookId]);

  // Track which product card is first-visible as the user scrolls the row.
  // Finds the card whose offsetLeft is closest to scrollLeft (reliable with scroll-snap).
  useEffect(() => {
    const container = productsRef.current;
    if (!container) return;
    function pickActive() {
      const scrollLeft = container!.scrollLeft;
      const cards = Array.from(
        container!.querySelectorAll<HTMLElement>("[id^='product-']")
      );
      if (cards.length === 0) return;
      const best = cards.reduce((prev, curr) =>
        Math.abs(curr.offsetLeft - scrollLeft) < Math.abs(prev.offsetLeft - scrollLeft)
          ? curr
          : prev
      );
      setActiveProductId(best.id.replace("product-", ""));
    }
    container.addEventListener("scroll", pickActive, { passive: true });
    // Also fire once immediately so the first card is selected on open
    pickActive();
    return () => container.removeEventListener("scroll", pickActive);
  }, [expandedLookId]);

  // Watch each star section; update ghost boxes to match whichever is on screen
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((el, starId) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisibleStarId(starId); },
        { threshold: 0.25 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [stars]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLook(lookId: string) {
    setExpandedLookId((prev) => (prev === lookId ? null : lookId));
  }

  // Expanded look at the top level — needed for the floating strip
  const expandedLook = looks.find((l) => l.id === expandedLookId) ?? null;
  const stripProducts = expandedLook ? sortedProducts(expandedLook.products) : [];
  // Teaser ghost images: use products from the currently visible star section
  const teaserStarId = visibleStarId ?? stars[0]?.id;
  const teaserLook = looks.find(
    (l) => l.star_id === teaserStarId && l.products && l.products.length > 0
  ) ?? looks.find((l) => l.products && l.products.length > 0) ?? null;
  const teaserProducts = teaserLook ? sortedProducts(teaserLook.products).slice(0, 6) : [];
  // On desktop hover: override ghost bar with the hovered look's products
  const hoveredLook = hoveredLookId ? (looks.find((l) => l.id === hoveredLookId) ?? null) : null;
  const hoveredProducts = hoveredLook && hoveredLook.products.length > 0
    ? sortedProducts(hoveredLook.products).slice(0, 6)
    : null;
  const activeTeaserLook = (expandedLookId === null && hoveredProducts) ? hoveredLook : teaserLook;
  const activeTeaserProducts = (expandedLookId === null && hoveredProducts) ? hoveredProducts : teaserProducts;
  // First look of whichever star section is currently on screen — shimmer follows scroll
  const firstLookId = (() => {
    const starId = visibleStarId ?? stars[0]?.id;
    if (!starId) return null;
    return looks
      .filter((l) => l.star_id === starId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.id ?? null;
  })();

  // Teaser: no look selected yet — show ghost placeholders to signal the strip exists
  const showTeaser = expandedLookId === null && !stripDismissed;
  // Active: a look is open, products are loaded, and we haven't scrolled past them
  const showActive =
    expandedLookId !== null &&
    !stripDismissed &&
    !productsInView &&
    stripProducts.length > 0;
  const stripVisible = showTeaser || showActive;

  // Add margin-bottom to <body> when the strip is visible so the footer
  // is never hidden underneath it — the extra space lets the user scroll
  // the footer clear above the strip.
  useEffect(() => {
    document.body.classList.toggle("strip-active", stripVisible);
    return () => document.body.classList.remove("strip-active");
  }, [stripVisible]);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 space-y-10 pt-6">
        {stars.map((star) => {
          const starLooks = looks
            .filter((l) => l.star_id === star.id)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

          if (starLooks.length === 0) return null;

          const starExpandedLook = starLooks.find((l) => l.id === expandedLookId);

          return (
            <section
              key={star.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(star.id, el);
                else sectionRefs.current.delete(star.id);
              }}
            >
              {/* Star header */}
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="font-serif text-navy text-xl md:text-2xl">{star.name}</h2>
                <div className="h-px flex-1 bg-navy/10" />
              </div>

              {/* Look cards — horizontal filmstrip on all screen sizes */}
              <div className="filmstrip overflow-x-auto -mx-4 px-4 mb-1">
                <div className="flex gap-3 w-max pb-2">
                  {starLooks.map((look) => {
                    const isActive = expandedLookId === look.id;
                    const isFirstLook = look.id === firstLookId && expandedLookId === null;
                    const lookHref = `/stars/${star.slug}/looks/${look.slug}`;
                    return (
                      <div
                        key={look.id}
                        onMouseEnter={() => expandedLookId === null && setHoveredLookId(look.id)}
                        onMouseLeave={() => setHoveredLookId(null)}
                        className="group block text-left shrink-0 w-44 md:w-52"
                      >
                        {/* Image area: clicking expands the inline Shop the Look products */}
                        <button
                          type="button"
                          onClick={() => toggleLook(look.id)}
                          aria-label={isActive ? `Hide products for ${look.title}` : `Shop the look: ${look.title}`}
                          className={`block w-full aspect-[3/4] relative overflow-hidden mb-2 rounded-sm transition-all duration-300 ${
                            isActive
                              ? "ring-2 ring-brass ring-offset-1"
                              : "ring-0"
                          }${isFirstLook ? " look-card--shimmer" : ""}`}
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
                            {look.year_display ?? look.year}
                          </p>
                          {isActive && (
                            <div className="absolute top-2 right-2 bg-brass text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center leading-none">
                              ×
                            </div>
                          )}
                        </button>
                        {/* Title + explicit "Read the story" link — navigates to the
                            dedicated look detail page where the editorial paragraph lives. */}
                        <Link href={lookHref} className="block">
                          <span
                            className={`block font-serif text-sm leading-snug transition-colors ${
                              isActive ? "text-brass" : "text-navy group-hover:text-brass"
                            }`}
                          >
                            {look.title}
                          </span>
                          <span className="mt-1 inline-block text-brass text-[10px] uppercase tracking-widest hover:underline underline-offset-2">
                            More about this Look →
                          </span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline product expansion — Change 2: tighter mt/pt/mb */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  starExpandedLook ? "max-h-[2000px] opacity-100 mt-1" : "max-h-0 opacity-0"
                }`}
              >
                {starExpandedLook && (
                  <div className="border-t border-brass/30 pt-3">
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-brass text-xs tracking-widest uppercase">
                        {starExpandedLook.year_display ?? starExpandedLook.year}
                      </p>
                      <span className="text-navy/20">·</span>
                      <p className="font-serif text-navy text-base">{starExpandedLook.title}</p>
                    </div>

                    {/* Change 1: single merged product row with scroll-snap */}
                    <div ref={productsRef} className="product-scroll-row">
                      {sortedProducts(starExpandedLook.products).map((product) => (
                        <div
                          key={product.id}
                          id={`product-${product.id}`}
                          className="product-card-snap"
                        >
                          <ProductFrame tier={product.match_tier ?? "modern"}>
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
                              <p className="text-navy/50 text-xs mb-1">{product.price_display}</p>
                            )}
                            {product.size && (
                              <p className="text-navy/50 text-xs mb-1">Size: {product.size}</p>
                            )}
                            <p className="text-navy/35 text-[10px] uppercase tracking-widest mb-2">
                              {TIER_SHORT[product.match_tier ?? "modern"]}
                            </p>
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

                    {starExpandedLook.image_credit && (
                      <p className="text-navy/30 text-xs mt-3 leading-relaxed">
                        {starExpandedLook.image_credit}
                        {starExpandedLook.image_source_url && (
                          <>
                            {" "}
                            <a
                              href={starExpandedLook.image_source_url}
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

      {/* Floating product preview strip — teaser + active states */}
      <div
        className={`product-strip${stripVisible ? " product-strip--visible" : ""}${showTeaser ? " product-strip--teaser" : ""}`}
        aria-hidden={!stripVisible}
      >
        {showTeaser ? (
          /* ── Teaser mode: ghost boxes + nudge label ── */
          <>
            <button
              onClick={() => activeTeaserLook && toggleLook(activeTeaserLook.id)}
              className="product-strip__teaser-btn"
              tabIndex={stripVisible ? 0 : -1}
            >
              Tap to Shop
            </button>
            <div className={`product-strip__thumbs${thumbsVisible ? "" : " product-strip__thumbs--fading"}`}>
              {activeTeaserProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => activeTeaserLook && toggleLook(activeTeaserLook.id)}
                  className={`product-strip__ghost${index === 0 ? " product-strip__ghost--active" : ""}`}
                  tabIndex={stripVisible ? 0 : -1}
                >
                  {product.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ── Active mode: real product thumbnails ── */
          <>
            <span className="product-strip__label">Shop this look</span>
            <div className={`product-strip__thumbs${thumbsVisible ? "" : " product-strip__thumbs--fading"}`}>
              {stripProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    document
                      .getElementById(`product-${product.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }}
                  className={`product-strip__thumb${product.id === activeProductId ? " product-strip__thumb--active" : ""}`}
                  title={product.title}
                  tabIndex={stripVisible ? 0 : -1}
                >
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-navy/20" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setStripDismissed(true)}
          className="product-strip__dismiss"
          aria-label="Dismiss"
          tabIndex={stripVisible ? 0 : -1}
        >
          ×
        </button>
      </div>
    </>
  );
}
