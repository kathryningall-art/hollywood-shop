import { Star, Look } from "./types";

// Phase 1 seed data — Louise Brooks, 1920s silent era
// publicityRightsRisk: low — estate not aggressive
// Images: replace placeholder URLs with verified Wikimedia Commons images
// before publishing. See SEED_IMAGES.md for guidance.

export const STARS: Star[] = [
  {
    id: "1",
    name: "Louise Brooks",
    slug: "louise-brooks",
    bio: "Louise Brooks was the quintessential flapper — a silent-screen actress whose sharp black bob and restless intelligence became the defining image of the Jazz Age. Born in Kansas in 1906, she moved to New York to dance with the Denishawn company before Hollywood beckoned. Her most celebrated work came in Germany: G.W. Pabst cast her in Pandora's Box (1929), where she played Lulu with an unsettling, modern frankness that still feels ahead of its time.",
    heroImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/9e/Brooks_Louise_Richee.jpg",
    heroImageCredit:
      "Portrait by Eugene Robert Richee, c. 1928. Public domain (PD-US-no_notice). Wikimedia Commons.",
    deathYear: 1985,
    publicityRightsRisk: "low",
    publicityRightsNotes:
      "Estate not known to enforce commercially. Pre-1930 images are clear public domain in the US.",
  },
];

export const LOOKS: Look[] = [
  {
    id: "1",
    starId: "1",
    slug: "pandoras-box-1929",
    title: "Pandora's Box — the Lulu look",
    year: 1929,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/85/Brooks%2C_PB.jpg",
    imageCredit:
      "Publicity still from Pandora's Box (1929), dir. G.W. Pabst. Nero-Film AG. Public domain (PD-US-not_renewed). Wikimedia Commons.",
    imageSourceUrl:
      "https://commons.wikimedia.org/wiki/File:Brooks,_PB.jpg",
    imageLicense: "PD-US-not_renewed",
    licenseVerified: true,
    licenseVerificationNotes:
      "Wikimedia Commons tag: PD-US-not_renewed. US copyright not renewed. Pre-1964 film material.",
    editorialText:
      "The look that launched a thousand bobs. For Pandora's Box, Pabst kept Brooks almost entirely in black — spare, modern, deliberately jarring against the expressionist excess around her. The dropped waist, the knife-pleated skirt, the way a single strand of pearls sat against a dark beaded bodice: this was 1929 knowing it was inventing something. The bob itself was already a statement before the film; on film, with Curt Courant's lighting finding every angle, it became an archetype. Contemporary takes on this look work best when they resist the costume impulse — one strong silhouette element, the right jewelry, the hair doing the heavy lifting.",
    published: true,
    products: [
      {
        id: "p1",
        lookId: "1",
        title: "Drop-waist flapper dress in black, beaded fringe",
        retailer: "Etsy",
        imageUrl: "https://placehold.co/400x400/1B2A4A/F5F0E8?text=Dress",
        priceDisplay: "$85–$220",
        affiliateUrl: "#",
        network: "etsy",
        displayOrder: 1,
      },
      {
        id: "p2",
        lookId: "1",
        title: "Art deco rhinestone bar brooch, geometric",
        retailer: "Etsy",
        imageUrl: "https://placehold.co/400x400/B8964E/F5F0E8?text=Brooch",
        priceDisplay: "$28–$75",
        affiliateUrl: "#",
        network: "etsy",
        displayOrder: 2,
      },
      {
        id: "p3",
        lookId: "1",
        title: "Long rope pearl necklace, layerable strand",
        retailer: "Amazon",
        imageUrl: "https://placehold.co/400x400/1B2A4A/F5F0E8?text=Pearls",
        priceDisplay: "$18–$45",
        affiliateUrl: "#",
        network: "amazon",
        displayOrder: 3,
      },
      {
        id: "p4",
        lookId: "1",
        title: "T-strap Mary Jane heels, black satin",
        retailer: "Nordstrom",
        imageUrl: "https://placehold.co/400x400/1B2A4A/F5F0E8?text=Shoes",
        priceDisplay: "$95–$175",
        affiliateUrl: "#",
        network: "nordstrom",
        displayOrder: 4,
      },
    ],
  },
  {
    id: "2",
    starId: "1",
    slug: "beggars-of-life-1928",
    title: "Beggars of Life — the runaway look",
    year: 1928,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Beggars_of_Life_mp129.jpg",
    imageCredit:
      "Publicity still for Beggars of Life (1928), dir. William Wellman. Paramount Pictures. Public domain (PD-US-no_notice). Wikimedia Commons.",
    imageSourceUrl:
      "https://commons.wikimedia.org/wiki/File:Beggars_of_Life_mp129.jpg",
    imageLicense: "PD-US-no_notice",
    licenseVerified: true,
    licenseVerificationNotes:
      "Wikimedia Commons tag: PD-US-no_notice. Published in the US before 1978 without copyright notice.",
    editorialText:
      "Beggars of Life gave Brooks something rare for a 1928 leading lady: trousers. Playing a girl who disguises herself as a boy to escape a murder charge, she wears wide-leg work pants, a loose shirt, and a flat cap — an accidental uniform for every decade that followed. The paradox is that the masculine clothes only emphasise how unconvincing the disguise is, which was the point. For modern wear, the lesson from this look is proportion: the wide trouser needs a close-fitting top, and the whole thing needs one rough-edged accessory to keep it from feeling precious.",
    published: true,
    products: [
      {
        id: "p5",
        lookId: "2",
        title: "Wide-leg linen trousers, cream or ivory",
        retailer: "Nordstrom",
        imageUrl: "https://placehold.co/400x400/F5F0E8/1B2A4A?text=Trousers",
        priceDisplay: "$65–$140",
        affiliateUrl: "#",
        network: "nordstrom",
        displayOrder: 1,
      },
      {
        id: "p6",
        lookId: "2",
        title: "Flat newsboy cap, wool herringbone",
        retailer: "Etsy",
        imageUrl: "https://placehold.co/400x400/B8964E/F5F0E8?text=Cap",
        priceDisplay: "$35–$90",
        affiliateUrl: "#",
        network: "etsy",
        displayOrder: 2,
      },
      {
        id: "p7",
        lookId: "2",
        title: "Cropped white cotton shirt, relaxed fit",
        retailer: "Amazon",
        imageUrl: "https://placehold.co/400x400/1B2A4A/F5F0E8?text=Shirt",
        priceDisplay: "$22–$48",
        affiliateUrl: "#",
        network: "amazon",
        displayOrder: 3,
      },
    ],
  },
];

export function getStarBySlug(slug: string): Star | undefined {
  return STARS.find((s) => s.slug === slug);
}

export function getLooksByStarId(starId: string): Look[] {
  return LOOKS.filter((l) => l.starId === starId && l.published);
}

export function getLookBySlug(starId: string, slug: string): Look | undefined {
  return LOOKS.find((l) => l.starId === starId && l.slug === slug);
}
