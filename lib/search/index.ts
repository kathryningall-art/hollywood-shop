import { SerperProvider } from "./serper";
import type { SearchProvider } from "./types";

export type { NormalizedResult, SearchProvider } from "./types";

// Factory — swap providers here (DataForSEOProvider, SerpAPIProvider, …)
// without touching the proposal pipeline.
export function getSearchProvider(): SearchProvider {
  return new SerperProvider();
}
