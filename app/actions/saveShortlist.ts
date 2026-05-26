"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SaveResult =
  | { success: true; added: number; redirect: string }
  | { success: false; error: string };

// Hostname → affiliate network mapping. Anything not listed is stored as
// "direct" — a raw link with no affiliate kickback. To monetize a new
// retailer, add its hostname here and sign up for that network individually.
const NETWORK_FROM_HOST: Record<string, string> = {
  "amazon.com": "amazon",
  "amazon.co.uk": "amazon",
  "etsy.com": "etsy",
  "nordstrom.com": "nordstrom",
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function networkFor(url: string): string {
  const host = hostnameOf(url);
  for (const [domain, network] of Object.entries(NETWORK_FROM_HOST)) {
    if (host === domain || host.endsWith(`.${domain}`)) return network;
  }
  return "direct";
}

function applyAffiliateTag(url: string): string {
  const host = hostnameOf(url);
  const tag = process.env.AMAZON_AFFILIATE_TAG;
  if (tag && (host === "amazon.com" || host.endsWith(".amazon.com") || host === "amazon.co.uk")) {
    try {
      const u = new URL(url);
      u.searchParams.set("tag", tag);
      return u.toString();
    } catch {
      return url;
    }
  }
  // Non-Amazon links are stored raw — no affiliate tag applied.
  return url;
}

export async function saveShortlist(params: {
  lookId: string;
  shortlistIds: string[];
}): Promise<SaveResult> {
  const { lookId, shortlistIds } = params;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { success: false, error: "Not signed in." };
  }

  // Pull all pending proposals for this look (we need both kept and discarded).
  const { data: proposals, error: pErr } = await supabase
    .from("product_proposals")
    .select("*")
    .eq("look_id", lookId)
    .eq("status", "pending");
  if (pErr) return { success: false, error: pErr.message };
  if (!proposals || proposals.length === 0) {
    return { success: true, added: 0, redirect: `/admin/looks/${lookId}` };
  }

  const keep = new Set(shortlistIds);
  const shortlisted = proposals.filter((p) => keep.has(p.id));

  // 1. Write sightings for every proposal (was_shortlisted flag), so cross-look
  //    history is preserved before we delete.
  const sightings = proposals.map((p) => ({
    product_url: p.product_url,
    look_id: lookId,
    was_shortlisted: keep.has(p.id),
  }));
  if (sightings.length > 0) {
    const { error: sErr } = await supabase.from("product_sightings").insert(sightings);
    if (sErr) return { success: false, error: `sightings: ${sErr.message}` };
  }

  // 2. Promote shortlisted → products.
  if (shortlisted.length > 0) {
    // Compute next display_order — append after any existing products for this look.
    const { data: maxRow } = await supabase
      .from("products")
      .select("display_order")
      .eq("look_id", lookId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextOrder = (maxRow?.display_order ?? -1) + 1;

    const newProducts = shortlisted.map((p) => ({
      look_id: lookId,
      title: p.title || "Untitled product",
      retailer: p.retailer || hostnameOf(p.product_url),
      image_url: p.image_url,
      price_display: p.price || "",
      affiliate_url: applyAffiliateTag(p.product_url),
      network: networkFor(p.product_url),
      slot_label: p.slot_label,
      display_order: nextOrder++,
      match_tier: "modern", // default — admin can refine on Products page
    }));

    const { error: ipErr } = await supabase.from("products").insert(newProducts);
    if (ipErr) return { success: false, error: `products: ${ipErr.message}` };
  }

  // 3. Delete all pending proposals for this look (history is in sightings now).
  const { error: dErr } = await supabase
    .from("product_proposals")
    .delete()
    .eq("look_id", lookId)
    .eq("status", "pending");
  if (dErr) return { success: false, error: `cleanup: ${dErr.message}` };

  revalidatePath(`/admin/looks/${lookId}`);
  revalidatePath(`/admin/looks/${lookId}/products`);

  return {
    success: true,
    added: shortlisted.length,
    redirect: `/admin/looks/${lookId}?flash=${encodeURIComponent(
      `${shortlisted.length} product${shortlisted.length === 1 ? "" : "s"} added`
    )}`,
  };
}
