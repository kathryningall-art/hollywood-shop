import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/og";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,              priority: 1.0, changeFrequency: "weekly"  },
    { url: `${SITE_URL}/browse`,  priority: 0.9, changeFrequency: "weekly"  },
    { url: `${SITE_URL}/about`,   priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/privacy`, priority: 0.3, changeFrequency: "monthly" },
  ];

  // Fetch all published looks with their star's slug.
  // RLS enforces published = true so no explicit filter needed.
  // Stars that appear here have at least one published look — the correct
  // proxy for a star being "live" on the site.
  const supabase = await createClient();
  const { data: looks, error } = await supabase
    .from("looks")
    .select("slug, created_at, stars!inner(slug)")
    .order("created_at", { ascending: false });

  if (error || !looks) {
    console.error("[sitemap] failed to fetch looks:", error?.message);
    return staticRoutes;
  }

  // Deduplicate star slugs while preserving the most-recent created_at
  // (first occurrence in the descending-ordered result).
  const seenStars = new Map<string, string>();
  for (const look of looks) {
    const star = look.stars as unknown as { slug: string };
    if (!seenStars.has(star.slug)) {
      seenStars.set(star.slug, look.created_at);
    }
  }

  const starRoutes: MetadataRoute.Sitemap = Array.from(seenStars.entries()).map(
    ([starSlug, createdAt]) => ({
      url: `${SITE_URL}/stars/${starSlug}`,
      lastModified: createdAt,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })
  );

  const lookRoutes: MetadataRoute.Sitemap = looks.map((look) => {
    const star = look.stars as unknown as { slug: string };
    return {
      url: `${SITE_URL}/stars/${star.slug}/looks/${look.slug}`,
      lastModified: look.created_at,
      priority: 0.7,
      changeFrequency: "weekly" as const,
    };
  });

  return [...staticRoutes, ...starRoutes, ...lookRoutes];
}
