export type NormalizedResult = {
  title: string;
  product_url: string;
  image_url: string;
  price: string | null;
  retailer: string;
  source_query: string;
  raw: unknown;
};

export interface SearchProvider {
  search(query: string, num_results?: number): Promise<NormalizedResult[]>;
}
