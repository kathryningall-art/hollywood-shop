"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { suggestQueries } from "@/app/actions/suggestQueries";
import {
  startGenerateProposals,
  type GenerateProposalsPlan,
} from "@/app/actions/generateProposals";

type Props = {
  open: boolean;
  onClose: () => void;
  lookId: string;
  imageUrl: string;
  starName: string;
  year: number | null;
  title: string;
  editorialText: string;
};

type Slot = { slot_label: string; queries: string };

const DEFAULT_SLOTS: Slot[] = [
  { slot_label: "Dress", queries: "" },
  { slot_label: "Jacket", queries: "" },
  { slot_label: "Shoes", queries: "" },
  { slot_label: "Jewelry", queries: "" },
];

type JobProgress = {
  total_queries: number;
  completed_queries: number;
  results_count: number;
  current_slot: string;
  current_query_index: number;
  per_query: { slot: string; query: string; status: string; count: number }[];
};

type Job = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  progress: JobProgress;
  error_message: string;
};

export default function GenerateProposalsModal({
  open,
  onClose,
  lookId,
  imageUrl,
  starName,
  year,
  title,
  editorialText,
}: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>(DEFAULT_SLOTS);
  const [numResults, setNumResults] = useState<number>(10);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setSlots(DEFAULT_SLOTS);
      setNumResults(10);
      setSuggestError("");
      setSubmitError("");
      setJobId(null);
      setJob(null);
    }
  }, [open]);

  // Poll job status.
  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/admin/proposal-jobs/${jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as Job;
        if (!alive) return;
        setJob(data);
        if (data.status === "done") {
          router.push(`/admin/looks/${lookId}/proposals`);
          return;
        }
        if (data.status === "error") {
          setSubmitError(data.error_message || "Job failed.");
          return;
        }
        setTimeout(tick, 1500);
      } catch {
        if (alive) setTimeout(tick, 2500);
      }
    };
    tick();
    return () => {
      alive = false;
    };
  }, [jobId, lookId, router]);

  if (!open) return null;

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestError("");
    const result = await suggestQueries({
      imageUrl,
      starName,
      year,
      title,
      editorialText,
      slots: slots.map((s) => s.slot_label),
    });
    setSuggesting(false);
    if (!result.success) {
      setSuggestError(result.error);
      return;
    }
    // Merge AI queries into the current slots, preserving labels and any existing input.
    setSlots((prev) =>
      prev.map((s) => {
        const ai = result.slots.find(
          (x) => x.slot_label.toLowerCase() === s.slot_label.toLowerCase()
        );
        if (!ai || ai.queries.length === 0) return s;
        const existing = s.queries.split("\n").map((q) => q.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...ai.queries]));
        return { ...s, queries: merged.join("\n") };
      })
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    const plan: GenerateProposalsPlan = slots.map((s) => ({
      slot_label: s.slot_label.trim(),
      queries: s.queries.split("\n").map((q) => q.trim()).filter(Boolean),
    }));
    const result = await startGenerateProposals({ lookId, plan, numResults });
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    setJobId(result.job_id);
  }

  function addSlot() {
    setSlots((prev) => [...prev, { slot_label: "New slot", queries: "" }]);
  }
  function removeSlot(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateSlot(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const totalQueries = slots.reduce(
    (n, s) => n + s.queries.split("\n").map((q) => q.trim()).filter(Boolean).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 flex items-start justify-center p-6 overflow-y-auto">
      <div className="bg-cream max-w-3xl w-full my-8 border border-navy/20 shadow-xl">
        <div className="flex items-center justify-between border-b border-navy/15 px-6 py-4">
          <h2 className="font-serif text-navy text-xl">Generate Proposals</h2>
          <button
            onClick={onClose}
            className="text-navy/40 hover:text-navy text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Plan editor */}
        {!jobId && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-navy/70 text-sm">
                One query per line, 1–5 per slot. The AI suggestions are a starting point — edit freely.
              </p>
              <button
                type="button"
                disabled={suggesting || !imageUrl}
                onClick={handleSuggest}
                className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={!imageUrl ? "Add an image URL first" : ""}
              >
                {suggesting ? "Asking AI…" : "Suggest with AI"}
              </button>
            </div>
            {suggestError && <p className="text-sm text-red-600">{suggestError}</p>}

            <div className="space-y-4">
              {slots.map((slot, i) => (
                <div key={i} className="border border-navy/15 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slot.slot_label}
                      onChange={(e) => updateSlot(i, { slot_label: e.target.value })}
                      className="border border-navy/20 px-2 py-1.5 text-navy text-sm font-medium focus:outline-none focus:border-brass bg-white"
                    />
                    <span className="text-navy/40 text-xs flex-1">
                      {slot.queries.split("\n").map((q) => q.trim()).filter(Boolean).length} queries
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={slot.queries}
                    onChange={(e) => updateSlot(i, { queries: e.target.value })}
                    rows={3}
                    placeholder="ivory silk slip dress bias cut 1930s&#10;cream satin bias gown vintage"
                    className="w-full border border-navy/20 px-3 py-2 text-navy text-sm focus:outline-none focus:border-brass bg-white font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSlot}
              className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy transition-colors"
            >
              + Add slot
            </button>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <div className="flex items-center justify-between border-t border-navy/10 pt-4 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <label className="text-navy/60">Results per query</label>
                <select
                  value={numResults}
                  onChange={(e) => setNumResults(parseInt(e.target.value))}
                  className="text-xs border border-navy/20 px-2 py-1 bg-white text-navy focus:outline-none focus:border-brass"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-navy/50 text-xs">
                  {totalQueries} {totalQueries === 1 ? "query" : "queries"} → up to {totalQueries * numResults} candidates
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || totalQueries === 0}
                  onClick={handleSubmit}
                  className="bg-navy text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass transition-colors disabled:opacity-50"
                >
                  {submitting ? "Starting…" : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {jobId && (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs tracking-widest uppercase text-navy/50">Progress</p>
              <p className="font-serif text-navy text-lg">
                {job?.status === "done"
                  ? "Done — redirecting…"
                  : job?.status === "error"
                  ? "Failed"
                  : `Fetching ${job?.progress.current_slot ?? "…"}`}
              </p>
              {job && (
                <p className="text-navy/60 text-sm">
                  {job.progress.completed_queries}/{job.progress.total_queries} queries
                  · {job.progress.results_count} candidates so far
                </p>
              )}
            </div>

            {job && (
              <div className="w-full h-2 bg-navy/10">
                <div
                  className="h-2 bg-brass transition-all"
                  style={{
                    width:
                      job.progress.total_queries === 0
                        ? "0%"
                        : `${(job.progress.completed_queries / job.progress.total_queries) * 100}%`,
                  }}
                />
              </div>
            )}

            {job && (
              <ul className="text-sm space-y-1 max-h-72 overflow-y-auto border border-navy/10 p-3 bg-white">
                {job.progress.per_query.map((q, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        q.status === "done"
                          ? "bg-green-600"
                          : q.status === "fetching"
                          ? "bg-amber-500 animate-pulse"
                          : q.status === "no_results"
                          ? "bg-navy/30"
                          : q.status === "error"
                          ? "bg-red-500"
                          : "bg-navy/15"
                      }`}
                    />
                    <span className="text-navy/50 text-xs w-20">{q.slot}</span>
                    <span className="text-navy flex-1 font-mono text-xs">{q.query}</span>
                    <span className="text-navy/50 text-xs">
                      {q.status === "done" || q.status === "no_results"
                        ? `${q.count}`
                        : q.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
