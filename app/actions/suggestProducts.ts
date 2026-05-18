"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { MatchTier } from "@/app/components/ProductFrame";

export type ProductSuggestion = {
  title: string;
  retailer: string;
  network: string;
  match_tier: MatchTier;
  search_hint: string;
};

type SuggestProductsResult =
  | { success: true; suggestions: ProductSuggestion[] }
  | { success: false; error: string };

export async function suggestProducts(params: {
  imageUrl: string;
  starName: string;
  year: number | null;
  title: string;
  editorialText: string;
}): Promise<SuggestProductsResult> {
  const { imageUrl, starName, year, title, editorialText } = params;

  if (!imageUrl) {
    return { success: false, error: "No image URL — add one to the look first." };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a product curator for Bias Cut Bureau, a Classic Hollywood fashion site. Look at this image: ${starName}, "${title}"${year ? ` (${year})` : ""}.

Editorial context: ${editorialText || "(none yet)"}

Suggest 6–8 shoppable products that would help a reader recreate or be inspired by this look. Mix the three tiers:

TIER GUIDANCE:
- "original_era" = genuine vintage items actually from this period (Etsy vintage listings described as "true vintage", "1920s vintage", "antique", items from specialist antique sellers). Rarer. Bias toward Etsy, network "etsy".
- "vintage_pre_owned" = actual secondhand/pre-owned vintage items not necessarily from the exact era but genuinely old (ThredUp, Depop, Poshmark, Etsy secondhand). Bias toward Etsy, network "etsy".
- "vintage_reproduction" = made today in period style (Etsy reproductions, costume-adjacent, modern makers working in period silhouettes, items described as "1920s style" or "flapper style"). Bias toward Etsy, network "etsy".
- "modern_inspired" = contemporary pieces that evoke the look without being period-styled (modern slip dress, current oxford shirt, mainstream retailer pieces). Bias toward Amazon/Nordstrom, network "amazon" or "nordstrom".

For each product include:
- "title": descriptive product name (what to search for)
- "retailer": e.g. "Etsy", "Amazon", "Nordstrom"
- "network": one of "etsy", "amazon", "nordstrom", "direct"
- "match_tier": one of "original_era", "vintage_pre_owned", "vintage_reproduction", "modern_inspired"
- "search_hint": 4–8 word search query to find this item

Bias the mix: 1–2 original_era, 1–2 vintage_pre_owned, 1–2 vintage_reproduction, 2–3 modern_inspired.

Respond with valid JSON only, no markdown fences:
{"suggestions":[{"title":"...","retailer":"...","network":"...","match_tier":"...","search_hint":"..."}]}`;

  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "BiasCutBureau/1.0 (product suggest)" },
    });
    if (!imgRes.ok) {
      return { success: false, error: `Could not fetch image (${imgRes.status}).` };
    }
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const mediaType = contentType.split(";")[0].trim() as
      | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const buffer = await imgRes.arrayBuffer();
    if (buffer.byteLength > 4.5 * 1024 * 1024) {
      return {
        success: false,
        error: `Image is too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB — max 5 MB). Use a smaller Wikimedia thumbnail URL.`,
      };
    }
    const base64 = Buffer.from(buffer).toString("base64");

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const usage = response.usage;
    console.log(
      `[suggestProducts] input=${usage.input_tokens} output=${usage.output_tokens} ` +
        `cost≈$${((usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000).toFixed(4)}`
    );

    const raw = response.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: { suggestions: ProductSuggestion[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[suggestProducts] raw response:", raw);
      return { success: false, error: "Model returned invalid JSON. Try again." };
    }

    if (!Array.isArray(parsed.suggestions)) {
      return { success: false, error: "Unexpected response shape. Try again." };
    }

    return { success: true, suggestions: parsed.suggestions };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
