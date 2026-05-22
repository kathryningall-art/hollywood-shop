import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";
import { buildOpenGraph, buildTwitter } from "@/lib/og";

const HOMEPAGE_TITLE = "Bias Cut Bureau — Classic Hollywood Style, Shop the Look";
const HOMEPAGE_DESCRIPTION =
  "A curated editorial celebrating the style of classic Hollywood, 1915–1969. Shop the look from Louise Brooks, Katharine Hepburn, Carole Lombard, and more.";

export const metadata: Metadata = {
  title: { absolute: HOMEPAGE_TITLE },
  description: HOMEPAGE_DESCRIPTION,
  openGraph: buildOpenGraph({
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    path: "/",
  }),
  twitter: buildTwitter({
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
  }),
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: stars }, { data: looks }] = await Promise.all([
    supabase
      .from("stars")
      .select("id, name, slug, bio, hero_image_url")
      .order("display_order"),
    supabase
      .from("looks")
      .select(`
        id, star_id, slug, title, year, year_display, display_order, image_url, image_credit, image_source_url, editorial_text,
        products(id, title, retailer, image_url, price_display, size, affiliate_url, network, display_order, match_tier)
      `)
      .eq("published", true)
      .order("display_order"),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-2xl md:text-3xl">
            Shop the <em className="italic text-brass/90">Look</em>
          </h1>
        </div>
      </section>

      {/* Interactive star grid + bottom sheet */}
      <HomeClient stars={stars ?? []} looks={looks ?? []} />

      {/* Ornamental divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="ornament-divider text-brass text-xs">◆</div>
      </div>

      {/* Editorial strip */}
      <section className="bg-navy text-cream py-16 px-6 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px w-6 bg-brass/60" />
              <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs">
                The Approach
              </p>
            </div>
            <h2 className="font-serif text-2xl md:text-4xl leading-snug">
              Every image is public domain.
              <br />
              <em className="italic text-brass/80">Every link is hand-curated.</em>
            </h2>
          </div>
          <p className="text-cream/60 leading-relaxed md:text-lg">
            We only publish looks built on images verified as public domain or
            Creative Commons — primarily from Wikimedia Commons and the Library
            of Congress. Product suggestions mix Etsy vintage sellers with
            contemporary retailers, so you can go full-vintage or build a
            modern wardrobe that quietly nods to the look.
          </p>
        </div>
      </section>
    </>
  );
}
