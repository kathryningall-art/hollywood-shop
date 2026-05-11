export type PublicityRightsRisk = "low" | "medium" | "high" | "blocked";

export type AffiliateNetwork =
  | "amazon"
  | "etsy"
  | "nordstrom"
  | "shareasale"
  | "impact"
  | "rakuten"
  | "direct";

export interface Star {
  id: string;
  name: string;
  slug: string;
  bio: string;
  heroImageUrl: string;
  heroImageCredit: string;
  deathYear: number | null;
  publicityRightsRisk: PublicityRightsRisk;
  publicityRightsNotes: string;
}

export interface Look {
  id: string;
  starId: string;
  slug: string;
  title: string;
  year: number;
  imageUrl: string;
  imageCredit: string;
  imageSourceUrl: string;
  imageLicense: string;
  licenseVerified: boolean;
  licenseVerificationNotes: string;
  editorialText: string;
  published: boolean;
  products: Product[];
}

export interface Product {
  id: string;
  lookId: string;
  title: string;
  retailer: string;
  imageUrl: string;
  priceDisplay: string;
  affiliateUrl: string;
  network: AffiliateNetwork;
  displayOrder: number;
}
