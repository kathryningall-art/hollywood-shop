"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getSearchProvider } from "@/lib/search";
import type { NormalizedResult } from "@/lib/search";

export type GenerateProposalsPlan = {
  slot_label: string;
  queries: string[];
}[];

type StartResult =
  | { success: true; job_id: string }
  | { success: false; error: string };

export async function startGenerateProposals(params: {
  lookId: string;
  plan: GenerateProposalsPlan;
  numResults?: number;
}): Promise<StartResult> {
  const { lookId, plan } = params;
  const numResults = Math.max(1, Math.min(100, params.numResults ?? 10));

  // Verify caller is authenticated and the look exists.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { success: false, error: "Not signed in." };
  }
  const { data: look, error: lookErr } = await supabase
    .from("looks")
    .select("id")
    .eq("id", lookId)
    .maybeSingle();
  if (lookErr || !look) {
    return { success: false, error: "Look not found." };
  }

  const cleanedPlan: GenerateProposalsPlan = plan
    .map((s) => ({
      slot_label: s.slot_label.trim(),
      queries: s.queries.map((q) => q.trim()).filter(Boolean),
    }))
    .filter((s) => s.slot_label && s.queries.length > 0);

  if (cleanedPlan.length === 0) {
    return { success: false, error: "Add at least one slot with one query." };
  }

  const totalQueries = cleanedPlan.reduce((n, s) => n + s.queries.length, 0);

  const initialProgress = {
    total_queries: totalQueries,
    completed_queries: 0,
    results_count: 0,
    current_slot: cleanedPlan[0].slot_label,
    current_query_index: 0,
    per_query: cleanedPlan.flatMap((s) =>
      s.queries.map((q) => ({
        slot: s.slot_label,
        query: q,
        status: "queued" as const,
        count: 0,
      }))
    ),
  };

  const service = createServiceClient();
  const { data: job, error: jobErr } = await service
    .from("proposal_jobs")
    .insert({
      look_id: lookId,
      status: "queued",
      plan: cleanedPlan,
      progress: initialProgress,
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    return { success: false, error: jobErr?.message ?? "Could not create job." };
  }

  // Run the worker after the response. On Node (next dev) it runs to completion;
  // on Vercel it runs via waitUntil (tune route maxDuration as needed).
  after(async () => {
    try {
      await runProposalJob(job.id, lookId, cleanedPlan, numResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await service
        .from("proposal_jobs")
        .update({
          status: "error",
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  });

  return { success: true, job_id: job.id };
}

async function runProposalJob(
  jobId: string,
  lookId: string,
  plan: GenerateProposalsPlan,
  numResults: number
): Promise<void> {
  const service = createServiceClient();
  const provider = getSearchProvider();

  await service
    .from("proposal_jobs")
    .update({ status: "running" })
    .eq("id", jobId);

  // Per-look dedupe: skip product_urls already approved as Products on this look.
  const { data: existing } = await service
    .from("products")
    .select("affiliate_url")
    .eq("look_id", lookId);
  const skipUrls = new Set((existing ?? []).map((p) => p.affiliate_url));

  // Within-run dedupe across all slots: same URL surfaced by multiple queries
  // collapses to one proposal whose source_queries array contains both.
  const runUrlIndex = new Map<string, { id: string; slot: string }>();

  let completed = 0;
  let resultsCount = 0;

  for (let si = 0; si < plan.length; si++) {
    const slot = plan[si];
    for (let qi = 0; qi < slot.queries.length; qi++) {
      const query = slot.queries[qi];
      const overallIndex = plan
        .slice(0, si)
        .reduce((n, s) => n + s.queries.length, 0) + qi;

      await updateQueryStatus(service, jobId, overallIndex, "fetching");
      await patchProgress(service, jobId, {
        current_slot: slot.slot_label,
        current_query_index: qi,
      });

      let results: NormalizedResult[] = [];
      try {
        results = await provider.search(query, numResults);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[generateProposals] query failed: ${query} — ${message}`);
        await updateQueryStatus(service, jobId, overallIndex, "error", 0);
        completed += 1;
        await patchProgress(service, jobId, { completed_queries: completed });
        continue;
      }

      let kept = 0;
      for (const r of results) {
        if (!r.image_url) continue; // edge case: skip results with no image
        if (skipUrls.has(r.product_url)) continue;

        const existingInRun = runUrlIndex.get(r.product_url);
        if (existingInRun) {
          // append this query to source_queries array on the prior proposal
          const { data: prior } = await service
            .from("product_proposals")
            .select("source_queries")
            .eq("id", existingInRun.id)
            .single();
          const merged = Array.from(
            new Set([...(prior?.source_queries ?? []), query])
          );
          await service
            .from("product_proposals")
            .update({ source_queries: merged })
            .eq("id", existingInRun.id);
          continue;
        }

        const { data: inserted, error: insErr } = await service
          .from("product_proposals")
          .insert({
            look_id: lookId,
            slot_label: slot.slot_label,
            product_url: r.product_url,
            image_url: r.image_url,
            title: r.title,
            price: r.price ?? "",
            retailer: r.retailer,
            source_queries: [query],
            source: "serper",
            status: "pending",
            raw_data: r.raw as object,
          })
          .select("id")
          .single();

        if (insErr) {
          // unique violation = already exists for this look/slot/url from a prior run
          if (!insErr.message.includes("duplicate")) {
            console.error("[generateProposals] insert failed:", insErr.message);
          }
          continue;
        }
        if (inserted) {
          runUrlIndex.set(r.product_url, {
            id: inserted.id,
            slot: slot.slot_label,
          });
          kept += 1;
        }
      }

      resultsCount += kept;
      completed += 1;
      const status = results.length === 0 ? "no_results" : "done";
      await updateQueryStatus(service, jobId, overallIndex, status, kept);
      await patchProgress(service, jobId, {
        completed_queries: completed,
        results_count: resultsCount,
      });
    }
  }

  await service
    .from("proposal_jobs")
    .update({
      status: "done",
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

type QueryStatus = "queued" | "fetching" | "done" | "no_results" | "error";

async function updateQueryStatus(
  service: ReturnType<typeof createServiceClient>,
  jobId: string,
  queryIndex: number,
  status: QueryStatus,
  count?: number
): Promise<void> {
  const { data } = await service
    .from("proposal_jobs")
    .select("progress")
    .eq("id", jobId)
    .single();
  if (!data) return;
  const progress = (data.progress ?? {}) as {
    per_query?: { slot: string; query: string; status: string; count: number }[];
  };
  const per_query = progress.per_query ?? [];
  if (per_query[queryIndex]) {
    per_query[queryIndex].status = status;
    if (typeof count === "number") per_query[queryIndex].count = count;
  }
  await service
    .from("proposal_jobs")
    .update({ progress: { ...progress, per_query } })
    .eq("id", jobId);
}

async function patchProgress(
  service: ReturnType<typeof createServiceClient>,
  jobId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const { data } = await service
    .from("proposal_jobs")
    .select("progress")
    .eq("id", jobId)
    .single();
  if (!data) return;
  await service
    .from("proposal_jobs")
    .update({ progress: { ...(data.progress ?? {}), ...patch } })
    .eq("id", jobId);
}
