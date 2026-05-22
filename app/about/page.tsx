import Image from "next/image";
import Link from "next/link";
import { La_Belle_Aurore } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const laBelleAurore = La_Belle_Aurore({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "About",
  description:
    "Bias Cut Bureau is a curated editorial dedicated to the style of classic Hollywood, from the silent-era cool of Louise Brooks to the studio-era glamour of Katharine Hepburn.",
};

export default async function AboutPage() {
  const supabase = await createClient();

  // Prefer a look whose editorial text mentions a bias cut dress (either spelling)
  const { data: biasLooks } = await supabase
    .from("looks")
    .select("image_url, title, image_credit")
    .eq("published", true)
    .not("image_url", "is", null)
    .or("editorial_text.ilike.%bias-cut%,editorial_text.ilike.%bias cut%")
    .order("display_order")
    .limit(1);

  // Fall back to the first published look if none match
  const { data: fallbackLooks } = !biasLooks?.length
    ? await supabase
        .from("looks")
        .select("image_url, title, image_credit")
        .eq("published", true)
        .not("image_url", "is", null)
        .order("display_order")
        .limit(1)
    : { data: null };

  const featuredLook = biasLooks?.[0] ?? fallbackLooks?.[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">

      {/* Two-column: photo left, heading + text right -- both start at the top */}
      <div className="grid md:grid-cols-[200px_1fr] gap-10 lg:gap-14 items-start mb-20">

        {/* Left: look photo */}
        {featuredLook?.image_url && (
          <div className="md:sticky md:top-28 w-36 md:w-auto">
            <div className="aspect-[3/4] relative overflow-hidden bg-navy/5">
              <Image
                src={featuredLook.image_url}
                alt={featuredLook.title ?? "A classic Hollywood look"}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 144px, 200px"
                priority
              />
            </div>
            {featuredLook.image_credit && (
              <p className="text-warm-gray/60 text-xs mt-2 leading-relaxed">
                {featuredLook.image_credit}
              </p>
            )}
          </div>
        )}

        {/* Right: heading + editorial text */}
        <div>
          <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">
            About
          </p>
          <h1 className="font-serif text-navy text-3xl md:text-4xl leading-snug mb-10">
            Bias Cut Bureau
          </h1>

          <div className="space-y-6 text-navy/75 leading-relaxed text-base md:text-lg">
            <p>
              Bias Cut Bureau is a curated editorial dedicated to the style of classic
              Hollywood, from the silent-era cool of Louise Brooks to the studio-era
              glamour of Katharine Hepburn.
            </p>
            <p>
              The name comes from a bias cut, which runs diagonal to the weave of the
              fabric, giving garments a flattering fit and natural flow. Madeleine
              Vionnet refined the technique in the 1920s, and within a decade Hollywood
              had made it the look of the era.
            </p>
            <p>
              It all starts with the look: a portrait, a publicity still, or a magazine
              cover. For each one, we curate four to six pieces that give a nod to the
              original, sometimes faithfully, sometimes loosely. An authentic 1930s
              bias-cut gown might sit next to a reproduction, which sits next to a
              department-store satin dress. Sometimes you just want the vibe, a
              silhouette, a feeling.
            </p>
            <p>
              Prices in the catalog are purposely varied. The Bureau is for everyone
              from the bride styling an Old Hollywood wedding to the classic movie fan
              wanting to bring a little big screen style to life. Every product is
              selected by hand, every image cleared for use.
            </p>
            <p>
              Start with the collections. Each is built around a single star, the films
              and photographs that made the style, and the pieces that will let you make
              it your own.
            </p>

            {/* Signature — closes the letter */}
            <div className="pt-6 pl-10">
              <p
                className={`${laBelleAurore.className} text-navy leading-none`}
                style={{
                  fontSize: "3.6rem",
                  transform: "rotate(-2deg)",
                  display: "inline-block",
                  transformOrigin: "left center",
                  wordSpacing: "-0.12em",
                }}
                aria-label="The Bias Cut Bureau"
              >
                The Bias Cut Bureau
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About our picks */}
      <section id="our-picks" className="mb-20 scroll-mt-28">
        <div className="ornament-divider text-brass text-xs mb-12">◆</div>

        <h2 className="font-serif text-navy text-2xl md:text-3xl mb-10 leading-snug">
          About Our Picks
        </h2>

        <div className="space-y-8">

          <div className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-10 items-baseline">
            <div className="flex items-center gap-3">
              <span
                className="flex-shrink-0"
                style={{ background: "#B89752", width: 18, height: 18, display: "inline-block" }}
                aria-hidden="true"
              />
              <span
                className="font-sc text-base md:text-lg tracking-[0.2em] uppercase font-medium"
                style={{ color: "#B89752" }}
              >
                Vintage
              </span>
            </div>
            <p className="text-navy/70 leading-relaxed">
              Genuine vintage pieces from the period itself — real items that have survived
              from the 1920s, 30s, 40s, 50s, or 60s, found mostly through Etsy&apos;s vintage
              sellers. They&apos;re rarer, sometimes more expensive, and one-of-a-kind.
            </p>
          </div>

          <div className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-10 items-baseline">
            <div className="flex items-center gap-3">
              <span
                className="flex-shrink-0"
                style={{ background: "#8B6F47", width: 18, height: 18, display: "inline-block" }}
                aria-hidden="true"
              />
              <span
                className="font-sc text-base md:text-lg tracking-[0.2em] uppercase font-medium"
                style={{ color: "#8B6F47" }}
              >
                Pre-Owned
              </span>
            </div>
            <p className="text-navy/70 leading-relaxed">
              Actual secondhand pieces — not necessarily from the exact era, but genuinely
              old. Found through Etsy resellers, ThredUp, Depop, and similar platforms.
              A sustainable way to get close to the look.
            </p>
          </div>

          <div className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-10 items-baseline">
            <div className="flex items-center gap-3">
              <span
                className="flex-shrink-0"
                style={{ background: "#735834", width: 18, height: 18, display: "inline-block" }}
                aria-hidden="true"
              />
              <span
                className="font-sc text-base md:text-lg tracking-[0.2em] uppercase font-medium"
                style={{ color: "#735834" }}
              >
                Reproduction
              </span>
            </div>
            <p className="text-navy/70 leading-relaxed">
              Made today in period style. A modern flapper dress modeled after the 1920s,
              or a contemporary maker working in mid-century silhouettes. These give you
              the look reliably in modern sizes.
            </p>
          </div>

          <div className="grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-10 items-baseline">
            <div className="flex items-center gap-3">
              <span
                className="flex-shrink-0 bg-navy/40"
                style={{ width: 18, height: 18, display: "inline-block" }}
                aria-hidden="true"
              />
              <span className="font-sc text-base md:text-lg tracking-[0.2em] uppercase font-medium text-navy/50">
                Modern
              </span>
            </div>
            <p className="text-navy/70 leading-relaxed">
              Contemporary pieces that capture the spirit of a look without being
              period-styled. A modern slip dress that nods to 1930s bias-cut. A current
              oxford shirt in the Hepburn mode. These work in any wardrobe.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <div>
        <Link
          href="/"
          className="font-sc text-brass tracking-[0.2em] uppercase text-xs hover:text-navy transition-colors"
        >
          Browse the Collections &rarr;
        </Link>
      </div>

    </div>
  );
}