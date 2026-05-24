"use server";

import Anthropic from "@anthropic-ai/sdk";

export type SlotQueries = {
  slot_label: string;
  queries: string[];
};

type SuggestQueriesResult =
  | { success: true; slots: SlotQueries[] }
  | { success: false; error: string };

const DEFAULT_SLOTS = ["Dress", "Jacket", "Shoes", "Jewelry"];

export async function suggestQueries(params: {
  imageUrl: string;
  starName: string;
  year: number | null;
  title: string;
  editorialText: string;
  slots?: string[];
}): Promise<SuggestQueriesResult> {
  const { imageUrl, starName, year, title, editorialText } = params;
  const slots = params.slots?.length ? params.slots : DEFAULT_SLOTS;

  if (!imageUrl) {
    return { success: false, error: "No image URL — add one to the look first." };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a product-search query writer for Bias Cut Bureau, a Classic Hollywood fashion site. Look at this image: ${starName}, "${title}"${year ? ` (${year})` : ""}.

Editorial context: ${editorialText || "(none yet)"}

For each garment slot below, write 2-3 distinct shopping-search queries that would surface products matching what's worn in the image. Queries should be specific (fabric, silhouette, era cue) — like phrases a shopper would type into Google to find the actual item.

Slots: ${slots.join(", ")}

Examples of good queries:
- "ivory silk slip dress bias cut 1930s"
- "black satin opera gloves elbow length"
- "art deco rhinestone drop earrings"
- "cream silk crepe blouse pussy bow"

Examples of bad queries (too vague):
- "white dress"
- "shoes"
- "vintage jewelry"

If a slot isn't visible in the image, return an empty queries array for it — don't invent. Skip slots that aren't represented at all.

Respond with valid JSON only, no markdown fences:
{"slots":[{"slot_label":"Dress","queries":["...","..."]},{"slot_label":"Shoes","queries":["..."]}]}`;

  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "BiasCutBureau/1.0 (suggest queries)" },
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
        error: `Image is too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB — max 5 MB).`,
      };
    }
    const base64 = Buffer.from(buffer).toString("base64");

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
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
      `[suggestQueries] input=${usage.input_tokens} output=${usage.output_tokens} ` +
        `cost≈$${((usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000).toFixed(4)}`
    );

    const raw = response.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: { slots: SlotQueries[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[suggestQueries] raw response:", raw);
      return { success: false, error: "Model returned invalid JSON. Try again." };
    }

    if (!Array.isArray(parsed.slots)) {
      return { success: false, error: "Unexpected response shape. Try again." };
    }

    // Ensure every requested slot appears, even if empty.
    const byLabel = new Map(parsed.slots.map((s) => [s.slot_label.toLowerCase(), s]));
    const filled: SlotQueries[] = slots.map((label) => {
      const match = byLabel.get(label.toLowerCase());
      return {
        slot_label: label,
        queries: match?.queries?.filter((q) => typeof q === "string" && q.trim()) ?? [],
      };
    });

    return { success: true, slots: filled };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
