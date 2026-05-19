"use server";

import Anthropic from "@anthropic-ai/sdk";

export type EditorialVariant = { voice: string; text: string };

type GenerateEditorialResult =
  | { success: true; variants: EditorialVariant[] }
  | { success: false; error: string };

export async function generateEditorial(params: {
  imageUrl: string;
  starName: string;
  year: number | null;
  title: string;
}): Promise<GenerateEditorialResult> {
  const { imageUrl, starName, year, title } = params;

  if (!imageUrl) {
    return { success: false, error: "No image URL — add one first." };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are writing editorial copy for a classic Hollywood fashion site called Bias Cut Bureau. The site celebrates the golden age of Hollywood (1915–1969) and helps readers shop similar looks.

Look at this image: ${starName}, "${title}"${year ? ` (${year})` : ""}.

Write 3 short editorial paragraphs about this look — one sentence each, ~40–60 words. Each should have a distinct voice:
1. Elegant — formal, magazine-editorial tone
2. Conversational — warm, personal, like a stylish friend
3. Atmospheric — evocative, cinematic, sensory detail

Focus on: the garment's silhouette, fabric feel, styling choices, and how a reader might wear something similar today. Do NOT mention shopping or products.

Respond with valid JSON only, no markdown fences:
{"variants":[{"voice":"elegant","text":"..."},{"voice":"conversational","text":"..."},{"voice":"atmospheric","text":"..."}]}`;

  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "BiasCutBureau/1.0 (editorial tool)" },
    });
    if (!imgRes.ok) {
      return { success: false, error: `Could not fetch image (${imgRes.status}). Check the URL.` };
    }
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const mediaType = contentType.split(";")[0].trim() as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    const buffer = await imgRes.arrayBuffer();
    const sizeBytes = buffer.byteLength;
    if (sizeBytes > 4.5 * 1024 * 1024) {
      return {
        success: false,
        error: `Image is too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB — max 5 MB). Use the Wikimedia thumbnail URL instead: replace the filename in the URL with a smaller version, e.g. add "/640px-" before the filename.`,
      };
    }
    const base64 = Buffer.from(buffer).toString("base64");

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const usage = response.usage;
    console.log(
      `[generateEditorial] input=${usage.input_tokens} output=${usage.output_tokens} ` +
        `cost≈$${((usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000).toFixed(4)}`
    );

    const raw = response.content.find((b) => b.type === "text")?.text ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: { variants: EditorialVariant[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[generateEditorial] raw response:", raw);
      return { success: false, error: "Model returned invalid JSON. Try again." };
    }

    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return { success: false, error: "Unexpected response shape. Try again." };
    }

    return { success: true, variants: parsed.variants };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Could not process image") || message.includes("fetch")) {
      return {
        success: false,
        error: "Image could not be loaded by Claude. Try a different image URL.",
      };
    }
    return { success: false, error: message };
  }
}
