/**
 * Open Graph + Pinterest metadata helpers.
 *
 * All OG image references must be absolute URLs. We compose them by
 * prepending SITE_URL to the relative path of files in `/public/`.
 */

// TODO: NEXT_PUBLIC_SITE_URL should be set in Vercel + .env.local.
//       Falling back to the canonical custom domain until the env var is wired up.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.biascutbureau.com";

/** Default OG image for pages without their own (homepage, browse). */
export const DEFAULT_OG_IMAGE = "/og-default-cream.jpg";

/** Alternate dark-variant OG image — swap in on a per-page basis if cream looks wrong. */
export const ALT_OG_IMAGE = "/og-default-navy.jpg";

/** Pinterest pin spec: portrait 2:3 ratio. */
export const OG_IMAGE_WIDTH = 1000;
export const OG_IMAGE_HEIGHT = 1500;

/** Truncate at a character limit and append an ellipsis if cut. */
export function truncate(text: string | null | undefined, max = 200): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).trimEnd() + "…";
}

/** Resolve a public path to an absolute URL Pinterest/Facebook will accept. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path; // already absolute
  const base = SITE_URL.replace(/\/$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}

/**
 * Build a Next.js-shaped OpenGraph metadata object for a page.
 * `path` is the canonical path (leading slash). `image` can be absolute or relative.
 */
export function buildOpenGraph({
  title,
  description,
  image,
  path,
}: {
  title: string;
  description: string;
  image?: string | null;
  path: string;
}) {
  const resolvedImage = absoluteUrl(image && image.length > 0 ? image : DEFAULT_OG_IMAGE);
  return {
    type: "website" as const,
    siteName: "Bias Cut Bureau",
    title,
    description,
    url: absoluteUrl(path),
    images: [
      {
        url: resolvedImage,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        type: "image/jpeg",
      },
    ],
  };
}

/** Twitter card payload — Pinterest also benefits from summary_large_image. */
export function buildTwitter({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string | null;
}) {
  const resolvedImage = absoluteUrl(image && image.length > 0 ? image : DEFAULT_OG_IMAGE);
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [resolvedImage],
  };
}

/**
 * Build a Pinterest pin description with brand header, editorial paragraph,
 * CTA, and hashtags. Stays within Pinterest's 500-character limit by
 * further truncating the editorial paragraph if needed.
 */
export function buildPinDescription({
  lookTitle,
  starName,
  editorialText,
  year,
}: {
  lookTitle: string;
  starName: string;
  editorialText?: string | null;
  year?: number | null;
}): string {
  const MAX = 500;

  const header = `${lookTitle} — ${starName} · Bias Cut Bureau`;
  const cta = "Shop the look at biascutbureau.com";

  // Star hashtag: name concatenated, alphanumeric only (handles hyphens, apostrophes)
  const starTag = `#${starName.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Decade hashtag: from year, e.g. 1932 → #1930sFashion
  const decadeTag =
    typeof year === "number" && year > 0
      ? `#${Math.floor(year / 10) * 10}sFashion`
      : null;

  const hashtags = [
    "#ClassicHollywood",
    "#VintageStyle",
    "#OldHollywood",
    starTag,
    "#VintageFashion",
    decadeTag,
  ]
    .filter(Boolean)
    .join(" ");

  function assemble(editorialBlock: string | null): string {
    return [header, editorialBlock, cta, hashtags]
      .filter((part): part is string => Boolean(part))
      .join("\n\n");
  }

  // Start with editorial truncated to 400 chars (per brief)
  let editorialBlock = editorialText ? truncate(editorialText, 400) : null;
  let description = assemble(editorialBlock || null);

  // If still too long, shrink editorial further until total fits within 500
  if (description.length > MAX && editorialBlock) {
    // How many chars over budget the description is
    const overflow = description.length - MAX;
    const newEditorialMax = Math.max(0, editorialBlock.length - overflow);
    editorialBlock = newEditorialMax > 0 ? truncate(editorialText, newEditorialMax) : null;
    description = assemble(editorialBlock);
  }

  return description;
}

/**
 * Pinterest-specific tags that can't go in `openGraph` or `twitter` blocks.
 * Use as the `other` field of a Next.js Metadata object.
 *
 * TODO: PINTEREST_VERIFY_CODE comes from Pinterest dashboard:
 *       Settings → Claimed Accounts → Claim a website
 *       Add the resulting code to .env.local AND to Vercel as PINTEREST_VERIFY_CODE.
 *       Until then, the verify tag renders with an empty content attribute (harmless).
 */
export const PINTEREST_OTHER: Record<string, string> = {
  "pinterest-rich-pin": "true",
  "p:domain_verify": process.env.PINTEREST_VERIFY_CODE ?? "",
};
