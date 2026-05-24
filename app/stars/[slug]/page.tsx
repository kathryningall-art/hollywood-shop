import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { buildOpenGraph, buildTwitter, truncate, SITE_URL } from "@/lib/og";
import { breadcrumbSchema, personSchema, safeJsonLd } from "@/lib/jsonld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: star } = await supabase
    .from("stars")
    .select("id, name, bio, hero_image_url")
    .eq("slug", slug)
    .single();
  if (!star) return {};

  // Find the star's primary look image, falling back to the hero portrait
  const { data: looks } = await supabase
    .from("looks")
    .select("image_url")
    .eq("star_id", star.id)
    .eq("published", true)
    .order("display_order")
    .limit(1);

  const ogImage = looks?.[0]?.image_url ?? star.hero_image_url ?? null;

  const ogTitle = `${star.name} — Classic Hollywood Style · Bias Cut Bureau`;
  const ogDescription = truncate(star.bio, 200);

  return {
    title: star.name,
    description: star.bio?.slice(0, 155) ?? "",
    openGraph: buildOpenGraph({
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      path: `/stars/${slug}`,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
    }),
  };
}

export default async function StarPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: star } = await supabase
    .from("stars")
    .select("id, name, slug, bio, hero_image_url, hero_image_credit")
    .eq("slug", slug)
    .single();

  if (!star) notFound();

  const { data: looks } = await supabase
    .from("looks")
    .select("id, slug, title, year, image_url")
    .eq("star_id", star.id)
    .eq("published", true)
    .order("year");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbSchema([
              { name: "Collections", url: SITE_URL },
              { name: star.name },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            personSchema({
              name: star.name,
              description: star.bio,
              imageUrl: star.hero_image_url,
              pageUrl: `${SITE_URL}/stars/${slug}`,
            })
          ),
        }}
      />
      {/* Star hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 grid md:grid-cols-[1fr_2fr] gap-12 items-start">
        <div className="aspect-[3/4] relative overflow-hidden bg-navy/5 max-w-xs">
          {star.hero_image_url && (
            <Image
              src={star.hero_image_url}
              alt={star.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 80vw, 300px"
              priority
            />
          )}
        </div>
        <div className="pt-4">
          <p className="font-sc text-brass tracking-widest uppercase text-xs mb-4">
            Collection
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-navy mb-6 leading-tight">
            {star.name}
          </h1>
          <p className="text-warm-gray leading-relaxed text-lg max-w-xl">
            {star.bio}
          </p>
          <p className="text-warm-gray/60 text-xs mt-6">
            {star.hero_image_credit}
          </p>
        </div>
      </section>

      {/* Filmstrip */}
      {looks && looks.length > 0 && (
        <section className="bg-navy py-12 mt-4">
          <div className="max-w-6xl mx-auto px-6 mb-8">
            <h2 className="font-serif text-cream text-2xl">The Looks</h2>
          </div>

          {/* Sprocket-hole decoration (top) */}
          <div className="flex gap-4 px-6 mb-3 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="shrink-0 w-6 h-4 rounded-sm bg-cream/10" />
            ))}
          </div>

          {/* Scrollable filmstrip */}
          <div className="filmstrip overflow-x-auto px-6 pb-2">
            <div className="flex gap-4 w-max">
              {looks.map((look) => (
                <Link
                  key={look.id}
                  href={`/stars/${star.slug}/looks/${look.slug}`}
                  className="group block shrink-0 w-52 md:w-64"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-navy/50 mb-3">
                    {look.image_url && (
                      <Image
                        src={look.image_url}
                        alt={look.title}
                        fill
                        className="object-cover object-top brightness-90 group-hover:brightness-100 transition-all duration-300"
                        sizes="256px"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-navy/80 to-transparent" />
                    <p className="absolute bottom-3 left-3 right-3 text-cream text-xs leading-snug">
                      {look.year}
                    </p>
                  </div>
                  <p className="font-serif text-cream text-sm leading-snug group-hover:text-brass transition-colors">
                    {look.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Sprocket-hole decoration (bottom) */}
          <div className="flex gap-4 px-6 mt-3 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="shrink-0 w-6 h-4 rounded-sm bg-cream/10" />
            ))}
          </div>
        </section>
      )}

      {/* Back */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="text-warm-gray hover:text-navy transition-colors text-sm tracking-widest uppercase"
        >
          ← All Collections
        </Link>
      </div>
    </>
  );
}
