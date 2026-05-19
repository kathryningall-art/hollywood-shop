import type { Metadata } from "next";
import ProductFrame from "@/app/components/ProductFrame";

export const metadata: Metadata = {
  title: "About Our Picks",
  description:
    "How Bias Cut Bureau classifies every product recommendation — Vintage, Reproduction, and Modern.",
};

function TierExample({ tier }: { tier: "vintage" | "pre_owned" | "reproduction" | "modern" }) {
  return (
    <div style={{ width: 60 }}>
      <ProductFrame tier={tier}>
        <div style={{ width: "100%", aspectRatio: "1/1", background: "#d6cfc4" }} />
      </ProductFrame>
    </div>
  );
}

export default function OurPicksPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
      <p className="font-sc text-brass tracking-[0.2em] uppercase text-xs mb-2">Editorial</p>
      <h1 className="font-serif text-navy text-3xl md:text-4xl mb-4 leading-snug">
        About Our Picks
      </h1>
      <p className="text-navy/60 leading-relaxed mb-14 md:text-lg">
        We sort every product into one of four categories so you know exactly what you&apos;re getting
        before you click.
      </p>

      {/* Tier 1 */}
      <div className="mb-14">
        <div className="flex items-start gap-6 mb-5">
          <TierExample tier="vintage" />
          <div>
            <h2 className="font-serif text-navy text-xl md:text-2xl mb-1">Vintage</h2>
            <p className="font-sc text-brass text-xs tracking-widest uppercase">Antique</p>
          </div>
        </div>
        <p className="text-navy/70 leading-relaxed">
          Genuine vintage pieces from the period itself. These are real items that have
          survived from the 1920s, 30s, 40s, 50s, or 60s — found mostly through Etsy&apos;s
          vintage sellers. They&apos;re rarer, sometimes more expensive, and one-of-a-kind.
        </p>
      </div>

      <div className="ornament-divider text-brass text-xs mb-14">◆</div>

      {/* Tier 2 */}
      <div className="mb-14">
        <div className="flex items-start gap-6 mb-5">
          <TierExample tier="pre_owned" />
          <div>
            <h2 className="font-serif text-navy text-xl md:text-2xl mb-1">Pre-Owned</h2>
            <p className="font-sc text-brass text-xs tracking-widest uppercase">Pre-Owned</p>
          </div>
        </div>
        <p className="text-navy/70 leading-relaxed">
          Actual secondhand and pre-owned vintage pieces — not necessarily from the exact
          era, but genuinely old. Found through Etsy secondhand sellers, ThredUp, Depop,
          and similar resale platforms. A sustainable way to get close to the look.
        </p>
      </div>

      <div className="ornament-divider text-brass text-xs mb-14">◆</div>

      {/* Tier 3 */}
      <div className="mb-14">
        <div className="flex items-start gap-6 mb-5">
          <TierExample tier="reproduction" />
          <div>
            <h2 className="font-serif text-navy text-xl md:text-2xl mb-1">Reproduction</h2>
            <p className="font-sc text-brass text-xs tracking-widest uppercase">Reproduction</p>
          </div>
        </div>
        <p className="text-navy/70 leading-relaxed">
          Made today in period style. A modern flapper dress modeled after the 1920s, or a
          contemporary maker working in mid-century silhouettes. These give you the look
          reliably in modern sizes and conditions.
        </p>
      </div>

      <div className="ornament-divider text-brass text-xs mb-14">◆</div>

      {/* Tier 4 */}
      <div className="mb-14">
        <div className="flex items-start gap-6 mb-5">
          <TierExample tier="modern" />
          <div>
            <h2 className="font-serif text-navy text-xl md:text-2xl mb-1">Modern</h2>
            <p className="font-sc text-brass text-xs tracking-widest uppercase">Modern</p>
          </div>
        </div>
        <p className="text-navy/70 leading-relaxed">
          Contemporary pieces that capture the spirit of a look without being period-styled.
          A modern slip dress that nods to 1930s bias-cut. A current oxford shirt in the
          Hepburn mode. These work in any wardrobe.
        </p>
      </div>

      <div className="ornament-divider text-brass text-xs mb-14">◆</div>

      <p className="text-navy/60 leading-relaxed italic">
        We try to include a mix of all three for every look — but availability varies,
        and we only recommend pieces we&apos;d actually wear ourselves.
      </p>
    </div>
  );
}
