import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: stars }, { data: looks }] = await Promise.all([
    supabase
      .from("stars")
      .select("id, name, slug, bio, hero_image_url")
      .order("name"),
    supabase
      .from("looks")
      .select(`
        id, star_id, slug, title, year, image_url, image_credit, image_source_url, editorial_text,
        products(id, title, retailer, image_url, price_display, affiliate_url, network, display_order)
      `)
      .eq("published", true)
      .order("year"),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream py-14 px-6 md:py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-6 bg-brass/60" />
              <p className="text-brass tracking-[0.2em] uppercase text-xs">
                Classic Hollywood, 1915–1969
              </p>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl leading-[1.05]">
              Shop the{" "}
              <em className="italic text-brass/90">Look</em>
            </h1>
          </div>
          <p className="text-cream/60 leading-relaxed md:text-lg">
            Each icon. Each silhouette. Modern pieces inspired by the screen
            sirens of the golden age — sourced from Etsy vintage sellers,
            contemporary shops, and everywhere in between.
          </p>
        </div>
      </section>

      {/* Ornamental divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="ornament-divider text-brass text-xs tracking-widest">◆</div>
      </div>

      {/* Collections heading */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-6">
        <p className="text-brass tracking-[0.2em] uppercase text-xs mb-1">Browse</p>
        <h2 className="font-serif text-2xl md:text-3xl text-navy">Collections</h2>
      </div>

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
              <p className="text-brass tracking-[0.2em] uppercase text-xs">
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
