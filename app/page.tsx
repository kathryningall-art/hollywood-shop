import Image from "next/image";
import Link from "next/link";
import { STARS } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-6 bg-brass/60" />
              <p className="text-brass tracking-[0.2em] uppercase text-xs">
                Classic Hollywood, 1915–1969
              </p>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] mb-8">
              Shop the
              <br />
              <em className="italic text-brass/90">Look</em>
            </h1>
          </div>
          <p className="text-cream/60 leading-relaxed text-lg">
            Each icon. Each silhouette. Modern pieces inspired by the screen
            sirens of the golden age — sourced from Etsy vintage sellers,
            contemporary shops, and everywhere in between.
          </p>
        </div>
      </section>

      {/* Ornamental divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="ornament-divider text-brass text-xs tracking-widest">
          ◆
        </div>
      </div>

      {/* Starlet grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brass tracking-[0.2em] uppercase text-xs mb-2">
              Browse
            </p>
            <h2 className="font-serif text-3xl text-navy tracking-tight">
              Collections
            </h2>
          </div>
          <div className="h-px flex-1 mx-8 bg-navy/8 hidden md:block" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
          {STARS.map((star) => (
            <Link
              key={star.id}
              href={`/stars/${star.slug}`}
              className="group block"
            >
              {/* Portrait with frame effect */}
              <div className="aspect-[3/4] relative overflow-hidden bg-navy/5 mb-5 portrait-frame">
                <Image
                  src={star.heroImageUrl}
                  alt={star.name}
                  fill
                  className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                {/* Vignette overlay that lifts on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent opacity-80 group-hover:opacity-30 transition-opacity duration-500" />
                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-serif text-cream text-base leading-tight drop-shadow-sm">
                    {star.name}
                  </p>
                </div>
              </div>
              <p className="text-warm-gray text-xs tracking-widest uppercase group-hover:text-brass transition-colors duration-300">
                {star.deathYear && star.deathYear <= 1929
                  ? "Silent Era"
                  : star.deathYear && star.deathYear <= 1950
                    ? "1920s – 1940s"
                    : "1920s – 1960s"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Ornamental divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="ornament-divider text-brass text-xs">◆</div>
      </div>

      {/* Editorial strip */}
      <section className="bg-navy text-cream py-24 px-6 mt-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-6 bg-brass/60" />
              <p className="text-brass tracking-[0.2em] uppercase text-xs">
                The Approach
              </p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl leading-snug">
              Every image is public domain.
              <br />
              <em className="italic text-brass/80">Every link is hand-curated.</em>
            </h2>
          </div>
          <p className="text-cream/60 leading-relaxed text-lg">
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
