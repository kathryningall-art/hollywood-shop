"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SortableProvider, SortableScope, DragHandle, diffOrder } from "@/app/admin/components/SortableList";

type Star = {
  id: string;
  name: string;
  slug: string;
  publicity_rights_risk: string;
  display_order: number;
};

const riskColor: Record<string, string> = {
  low: "text-green-700 bg-green-50",
  medium: "text-amber-700 bg-amber-50",
  high: "text-orange-700 bg-orange-50",
  blocked: "text-red-700 bg-red-50",
};

export default function AdminStarsTable({ initialStars }: { initialStars: Star[] }) {
  const [stars, setStars] = useState(
    [...initialStars].sort((a, b) => a.display_order - b.display_order)
  );
  const [busy, setBusy] = useState(false);

  async function handleReorder(next: Star[]) {
    if (busy) return;
    // Optimistic UI: snap to new order immediately.
    const updates = diffOrder(stars, next);
    const renumbered = next.map((s, i) => ({ ...s, display_order: i }));
    setStars(renumbered);

    setBusy(true);
    try {
      const supabase = createClient();
      await Promise.all(
        updates.map((u) =>
          supabase.from("stars").update({ display_order: u.display_order }).eq("id", u.id)
        )
      );
    } catch (err) {
      console.error("[stars reorder] persist failed:", err);
      // Roll back on failure.
      setStars(stars);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SortableProvider items={stars} onReorder={handleReorder}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-navy/20 text-xs tracking-widest uppercase text-navy/50">
            <th className="text-left py-2 pr-4 font-normal w-10"></th>
            <th className="text-left py-2 pr-4 font-normal">Name</th>
            <th className="text-left py-2 pr-4 font-normal">Slug</th>
            <th className="text-left py-2 pr-4 font-normal">Rights Risk</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          <SortableScope items={stars}>
            {(star, { ref, style, handleProps, isDragging }) => (
            <tr
              ref={ref}
              style={style}
              className={`border-b border-navy/10 ${isDragging ? "bg-cream" : "hover:bg-cream/50"}`}
            >
              <td className="py-3 pr-2 align-middle">
                <DragHandle {...handleProps} />
              </td>
              <td className="py-3 pr-4 text-navy font-medium">{star.name}</td>
              <td className="py-3 pr-4 text-navy/60 font-mono text-xs">{star.slug}</td>
              <td className="py-3 pr-4">
                <span
                  className={`text-xs px-2 py-0.5 rounded-sm font-medium uppercase tracking-wide ${riskColor[star.publicity_rights_risk] ?? ""}`}
                >
                  {star.publicity_rights_risk}
                </span>
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/admin/stars/${star.id}`}
                  className="text-xs text-brass hover:text-navy uppercase tracking-widest"
                >
                  Edit
                </Link>
              </td>
            </tr>
          )}
          </SortableScope>
        </tbody>
      </table>
    </SortableProvider>
  );
}
