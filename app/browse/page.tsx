import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BrowseClient from "./BrowseClient";

export const metadata: Metadata = {
  title: "Browse All Products",
  description:
    "Filter and search every product on Bias Cut Bureau by category, price, size, and keyword.",
};

export default async function BrowsePage() {
  const supabase = await createClient();

  const { data: looks } = await supabase
    .from("looks")
    .select(`
      id, title, year, year_display, image_url, slug,
      stars(id, name, slug),
      products(id, title, retailer, image_url, price_display, size, affiliate_url, network, match_tier, display_order)
    `)
    .eq("published", true)
    .order("display_order");

  // Flatten all products, attaching look + star context to each
  type RawLook = NonNullable<typeof looks>[number];
  type RawStar = { id: string; name: string; slug: string };
  type RawProduct = RawLook["products"][number];

  const products = (looks ?? []).flatMap((look: RawLook) => {
    const star = look.stars as unknown as RawStar | null;
    if (!star) return [];
    return (look.products as RawProduct[])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((p) => ({
        id: p.id,
        title: p.title,
        retailer: p.retailer,
        image_url: p.image_url,
        price_display: p.price_display,
        size: p.size,
        affiliate_url: p.affiliate_url,
        network: p.network,
        match_tier: p.match_tier,
        look: {
          id: look.id,
          title: look.title,
          year: look.year,
          year_display: look.year_display,
          image_url: look.image_url,
          slug: look.slug,
        },
        star,
      }));
  });

  return (
    <>
      <section className="bg-navy text-cream px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-2xl md:text-3xl">
            Browse <em className="italic text-brass/90">All Products</em>
          </h1>
        </div>
      </section>

      <BrowseClient products={products} />
    </>
  );
}
