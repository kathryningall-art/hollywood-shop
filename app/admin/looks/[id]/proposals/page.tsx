import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProposalsReview, { type ProposalTile, type SeenBefore } from "./ProposalsReview";

type Look = {
  id: string;
  title: string;
  image_url: string | null;
  star_name: string;
};

export default async function ProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lookId } = await params;
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/login");

  const { data: lookRow } = await supabase
    .from("looks")
    .select("id, title, image_url, stars(name)")
    .eq("id", lookId)
    .maybeSingle();
  if (!lookRow) {
    return (
      <div className="p-8">
        <p className="text-navy/60">Look not found.</p>
      </div>
    );
  }
  const starsField = lookRow.stars as { name?: string } | { name?: string }[] | null;
  const star_name =
    (Array.isArray(starsField) ? starsField[0]?.name : starsField?.name) ?? "";
  const look: Look = {
    id: lookRow.id,
    title: lookRow.title,
    image_url: lookRow.image_url,
    star_name,
  };

  const { data: proposals } = await supabase
    .from("product_proposals")
    .select("id, slot_label, product_url, image_url, title, price, retailer, source_queries, created_at")
    .eq("look_id", lookId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!proposals || proposals.length === 0) {
    return (
      <div className="max-w-2xl">
        <Header look={look} />
        <div className="mt-8 border border-navy/15 bg-cream/40 p-8 text-center">
          <p className="font-serif text-navy text-lg mb-2">No proposals yet</p>
          <p className="text-navy/60 text-sm mb-6">
            Generate some candidates from the look edit page.
          </p>
          <Link
            href={`/admin/looks/${lookId}`}
            className="text-xs tracking-widest uppercase text-cream bg-navy hover:bg-brass px-4 py-2 transition-colors"
          >
            Back to Look
          </Link>
        </div>
      </div>
    );
  }

  // Determine slot ordering — from the most recent proposal_jobs.plan if any,
  // else fall back to first-appearance order in proposals.
  const { data: latestJob } = await supabase
    .from("proposal_jobs")
    .select("plan, created_at")
    .eq("look_id", lookId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slotOrder: string[] = [];
  if (latestJob?.plan && Array.isArray(latestJob.plan)) {
    for (const s of latestJob.plan as { slot_label: string }[]) {
      if (s.slot_label && !slotOrder.includes(s.slot_label)) slotOrder.push(s.slot_label);
    }
  }
  for (const p of proposals) {
    if (!slotOrder.includes(p.slot_label)) slotOrder.push(p.slot_label);
  }

  // Cross-look "seen before" lookups, keyed by product_url.
  const urls = Array.from(new Set(proposals.map((p) => p.product_url)));

  const seenBefore = new Map<string, SeenBefore>();

  if (urls.length > 0) {
    // Approved products on OTHER looks.
    const { data: otherProducts } = await supabase
      .from("products")
      .select("affiliate_url, created_at, looks(id, title)")
      .in("affiliate_url", urls)
      .neq("look_id", lookId)
      .order("created_at", { ascending: false });

    for (const row of otherProducts ?? []) {
      const url = row.affiliate_url;
      const looksRow = Array.isArray(row.looks) ? row.looks[0] : row.looks;
      if (!looksRow) continue;
      const prior = seenBefore.get(url);
      if (!prior) {
        seenBefore.set(url, {
          type: "shortlisted",
          look_title: looksRow.title,
          look_id: looksRow.id,
          more_count: 0,
        });
      } else if (prior.type === "shortlisted") {
        prior.more_count += 1;
      } else {
        // shortlisted wins over surfaced
        seenBefore.set(url, {
          type: "shortlisted",
          look_title: looksRow.title,
          look_id: looksRow.id,
          more_count: 1,
        });
      }
    }

    // Sightings on OTHER looks (non-shortlisted; the shortlisted ones already became products).
    const { data: otherSightings } = await supabase
      .from("product_sightings")
      .select("product_url, surfaced_at, was_shortlisted, looks(id, title)")
      .in("product_url", urls)
      .neq("look_id", lookId)
      .eq("was_shortlisted", false)
      .order("surfaced_at", { ascending: false });

    for (const row of otherSightings ?? []) {
      const url = row.product_url;
      const looksRow = Array.isArray(row.looks) ? row.looks[0] : row.looks;
      if (!looksRow) continue;
      const prior = seenBefore.get(url);
      if (!prior) {
        seenBefore.set(url, {
          type: "surfaced",
          look_title: looksRow.title,
          look_id: looksRow.id,
          more_count: 0,
        });
      } else {
        prior.more_count += 1;
      }
    }
  }

  const tiles: ProposalTile[] = proposals.map((p) => ({
    id: p.id,
    slot_label: p.slot_label,
    product_url: p.product_url,
    image_url: p.image_url,
    title: p.title,
    price: p.price,
    retailer: p.retailer,
    source_queries: p.source_queries ?? [],
    seen_before: seenBefore.get(p.product_url) ?? null,
  }));

  return (
    <div className="-mx-6">
      <div className="px-6">
        <Header look={look} />
      </div>
      <ProposalsReview lookId={lookId} slotOrder={slotOrder} tiles={tiles} />
    </div>
  );
}

function Header({ look }: { look: Look }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {look.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={look.image_url}
          alt=""
          className="w-16 h-16 object-cover border border-navy/20"
        />
      )}
      <div className="flex-1">
        <p className="text-xs tracking-widest uppercase text-navy/50">{look.star_name}</p>
        <h1 className="font-serif text-navy text-2xl">{look.title}</h1>
      </div>
      <Link
        href={`/admin/looks/${look.id}`}
        className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy"
      >
        ← Back to look
      </Link>
    </div>
  );
}
