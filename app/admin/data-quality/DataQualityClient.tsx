"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MatchTier } from "@/app/components/ProductFrame";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlaggedProduct = {
  id: string;
  title: string | null;
  retailer: string | null;
  network: string | null;
  match_tier: MatchTier | null;
  affiliate_url: string | null;
  price_display: string | null;
  image_url: string | null;
  look_id: string | null;
  look_title: string | null;
  issues: Issue[];
};

export type Issue = {
  code: string;
  message: string;
  autoFix?: { field: "retailer" | "match_tier"; value: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_META: Record<string, { label: string; severity: "high" | "medium" | "low" }> = {
  A: { label: "Retailer label mismatch",   severity: "medium" },
  B: { label: "Tier mismatch",             severity: "high"   },
  C: { label: "URL in title",              severity: "high"   },
  D: { label: "Price in title",            severity: "high"   },
  E: { label: "All-caps title",            severity: "medium" },
  F: { label: "Non-standard price format", severity: "low"    },
  J: { label: "Unknown domain",            severity: "low"    },
};

const RULE_ORDER = ["B", "C", "D", "A", "E", "F", "J"];

const SEVERITY_BADGE: Record<"high" | "medium" | "low", string> = {
  high:   "bg-red-50 border-red-200 text-red-700",
  medium: "bg-amber-50 border-amber-200 text-amber-700",
  low:    "bg-sky-50 border-sky-200 text-sky-700",
};

const TIER_LABELS: Record<MatchTier, string> = {
  vintage:      "Vintage",
  pre_owned:    "Pre-Owned",
  reproduction: "Reproduction",
  modern:       "Modern",
};

// ─── Main client component ────────────────────────────────────────────────────

export default function DataQualityClient({
  initialProducts,
  totalCount,
}: {
  initialProducts: FlaggedProduct[];
  totalCount: number;
}) {
  // Local copy we mutate optimistically
  const [products, setProducts] = useState<FlaggedProduct[]>(initialProducts);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setProductField(id: string, updates: Partial<FlaggedProduct>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }

  function removeIssue(productId: string, code: string) {
    setProducts((prev) =>
      prev
        .map((p) => {
          if (p.id !== productId) return p;
          const remaining = p.issues.filter((i) => i.code !== code);
          return { ...p, issues: remaining };
        })
        .filter((p) => p.issues.length > 0)
    );
  }

  function setSavingKey(key: string, val: boolean) {
    setSaving((prev) => ({ ...prev, [key]: val }));
  }

  function setError(key: string, msg: string) {
    setErrors((prev) => ({ ...prev, [key]: msg }));
    setTimeout(() => setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; }), 4000);
  }

  // ── Patch a single field ──────────────────────────────────────────────────

  async function applyFix(
    product: FlaggedProduct,
    issueCode: string,
    patch: Record<string, unknown>
  ) {
    const key = `${product.id}-${issueCode}`;
    setSavingKey(key, true);

    const { error } = await supabase
      .from("products")
      .update(patch)
      .eq("id", product.id);

    setSavingKey(key, false);

    if (error) {
      setError(key, error.message);
      return;
    }

    // Optimistic: update local product data + remove that issue
    const fieldUpdates: Partial<FlaggedProduct> = {};
    for (const [k, v] of Object.entries(patch)) {
      (fieldUpdates as Record<string, unknown>)[k] = v;
    }
    setProductField(product.id, fieldUpdates);
    removeIssue(product.id, issueCode);
  }

  // ── Inline edit state ─────────────────────────────────────────────────────

  const [editingTitle, setEditingTitle] = useState<Record<string, string>>({});
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});

  // ── Build grouped view ────────────────────────────────────────────────────

  const byRule = new Map<string, FlaggedProduct[]>();
  for (const p of products) {
    for (const issue of p.issues) {
      if (!byRule.has(issue.code)) byRule.set(issue.code, []);
      // deduplicate same product appearing twice under same rule
      const arr = byRule.get(issue.code)!;
      if (!arr.find((x) => x.id === p.id)) arr.push(p);
    }
  }

  const totalFlagged = new Set(products.map((p) => p.id)).size;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-brass tracking-[0.2em] uppercase text-xs mb-1">Admin</p>
          <h1 className="font-serif text-navy text-3xl">Data Quality</h1>
          <p className="text-navy/50 text-sm mt-2">
            {totalFlagged === 0
              ? `All ${totalCount} products look clean.`
              : `${totalFlagged} of ${totalCount} products have issues — fix them inline below.`}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs tracking-widest uppercase text-navy/40 hover:text-navy transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {totalFlagged === 0 && (
        <div className="border border-green-200 bg-green-50 rounded p-8 text-center">
          <p className="text-green-700 font-serif text-xl mb-1">All clear</p>
          <p className="text-green-600 text-sm">No data quality issues detected.</p>
        </div>
      )}

      <div className="space-y-12">
        {RULE_ORDER.filter((code) => byRule.has(code)).map((code) => {
          const items = byRule.get(code)!;
          const meta = RULE_META[code] ?? { label: `Rule ${code}`, severity: "low" as const };

          return (
            <section key={code}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 border rounded ${SEVERITY_BADGE[meta.severity]}`}>
                  {code}
                </span>
                <h2 className="font-serif text-navy text-xl">{meta.label}</h2>
                <span className="text-navy/30 text-sm">{items.length} product{items.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="border border-navy/10 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy/5 text-left text-xs tracking-widest uppercase text-navy/50">
                      <th className="px-4 py-2.5 font-normal">Product</th>
                      <th className="px-4 py-2.5 font-normal">Current</th>
                      <th className="px-4 py-2.5 font-normal">Fix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {items.map((p) => {
                      const issue = p.issues.find((i) => i.code === code)!;
                      const savingKey = `${p.id}-${code}`;
                      const isSaving = saving[savingKey];
                      const saveError = errors[savingKey];

                      return (
                        <tr key={p.id} className="align-top group/row">
                          {/* Product info */}
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-navy text-sm leading-snug line-clamp-2 mb-0.5">
                              {p.title ?? <span className="italic text-navy/30">(no title)</span>}
                            </p>
                            <p className="text-navy/40 text-xs">
                              {p.retailer ?? "—"} ·{" "}
                              <span className="font-mono">{p.match_tier ?? "—"}</span>
                            </p>
                            {p.look_title && (
                              <p className="text-navy/30 text-xs italic mt-0.5">{p.look_title}</p>
                            )}
                          </td>

                          {/* Current value relevant to this rule */}
                          <td className="px-4 py-3 text-navy/50 text-xs max-w-[200px]">
                            <span className="text-navy/40">{issue.message}</span>
                          </td>

                          {/* Fix column */}
                          <td className="px-4 py-3 min-w-[220px]">
                            {saveError && (
                              <p className="text-red-600 text-xs mb-1">{saveError}</p>
                            )}

                            {/* ── A or B: auto-fix button ─────────────── */}
                            {issue.autoFix && (
                              <button
                                disabled={isSaving}
                                onClick={() =>
                                  applyFix(p, code, { [issue.autoFix!.field]: issue.autoFix!.value })
                                }
                                className="text-xs tracking-widest uppercase bg-navy text-cream px-3 py-1.5 hover:bg-brass transition-colors disabled:opacity-40"
                              >
                                {isSaving
                                  ? "Saving…"
                                  : `Set to "${issue.autoFix.field === "match_tier"
                                      ? TIER_LABELS[issue.autoFix.value as MatchTier] ?? issue.autoFix.value
                                      : issue.autoFix.value
                                    }"`}
                              </button>
                            )}

                            {/* ── C / D / E: editable title ──────────── */}
                            {(code === "C" || code === "D" || code === "E") && (
                              <div className="flex gap-2 items-start">
                                <div className="flex-1">
                                  {code === "E" && !(editingTitle[p.id] !== undefined) && (
                                    <button
                                      disabled={isSaving}
                                      onClick={() => {
                                        const fixed = (p.title ?? "")
                                          .toLowerCase()
                                          .replace(/\b\w/g, (c) => c.toUpperCase());
                                        applyFix(p, code, { title: fixed });
                                      }}
                                      className="text-xs tracking-widest uppercase bg-navy text-cream px-3 py-1.5 hover:bg-brass transition-colors disabled:opacity-40 mb-2 block"
                                    >
                                      {isSaving ? "Saving…" : "Auto title-case"}
                                    </button>
                                  )}
                                  <textarea
                                    rows={2}
                                    value={editingTitle[p.id] ?? p.title ?? ""}
                                    onChange={(e) =>
                                      setEditingTitle((prev) => ({ ...prev, [p.id]: e.target.value }))
                                    }
                                    className="w-full border border-navy/20 px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-brass resize-none"
                                    placeholder="Edit title…"
                                  />
                                </div>
                                <button
                                  disabled={isSaving || !(editingTitle[p.id] !== undefined)}
                                  onClick={() => {
                                    const val = editingTitle[p.id];
                                    if (val !== undefined) {
                                      applyFix(p, code, { title: val }).then(() => {
                                        setEditingTitle((prev) => {
                                          const n = { ...prev }; delete n[p.id]; return n;
                                        });
                                      });
                                    }
                                  }}
                                  className="text-xs tracking-widest uppercase bg-navy text-cream px-3 py-1.5 hover:bg-brass transition-colors disabled:opacity-40 self-end"
                                >
                                  {isSaving ? "…" : "Save"}
                                </button>
                              </div>
                            )}

                            {/* ── F: editable price ──────────────────── */}
                            {code === "F" && (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editingPrice[p.id] ?? p.price_display ?? ""}
                                  onChange={(e) =>
                                    setEditingPrice((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                  placeholder="e.g. $42 or $42.50"
                                  className="border border-navy/20 px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-brass w-28"
                                />
                                <button
                                  disabled={isSaving || !(editingPrice[p.id] !== undefined)}
                                  onClick={() => {
                                    const val = editingPrice[p.id];
                                    if (val !== undefined) {
                                      applyFix(p, code, { price_display: val || null }).then(() => {
                                        setEditingPrice((prev) => {
                                          const n = { ...prev }; delete n[p.id]; return n;
                                        });
                                      });
                                    }
                                  }}
                                  className="text-xs tracking-widest uppercase bg-navy text-cream px-3 py-1.5 hover:bg-brass transition-colors disabled:opacity-40"
                                >
                                  {isSaving ? "…" : "Save"}
                                </button>
                              </div>
                            )}

                            {/* ── J: informational only ──────────────── */}
                            {code === "J" && !issue.autoFix && (
                              <p className="text-navy/30 text-xs italic">
                                No auto-fix — tier and retailer may need manual review.
                              </p>
                            )}

                            {/* ── Dismiss (always shown) ──────────────── */}
                            <button
                              onClick={() => removeIssue(p.id, code)}
                              className="mt-2 text-[11px] text-navy/25 hover:text-navy/60 transition-colors tracking-wide"
                              title="Dismiss — mark as reviewed, no change needed"
                            >
                              × Dismiss
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer */}
      {totalFlagged > 0 && (
        <div className="mt-16 border-t border-navy/10 pt-8">
          <p className="text-navy/30 text-xs leading-relaxed">
            Rules: <strong>B</strong> tier mismatch · <strong>C</strong> URL in title ·{" "}
            <strong>D</strong> price in title · <strong>A</strong> retailer label mismatch ·{" "}
            <strong>E</strong> all-caps title · <strong>F</strong> non-standard price ·{" "}
            <strong>J</strong> unknown domain.
            Fixes apply immediately. Resolved issues disappear automatically.
          </p>
        </div>
      )}
    </div>
  );
}
