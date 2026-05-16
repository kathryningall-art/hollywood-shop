"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

  async function move(id: string, direction: "up" | "down") {
    const idx = stars.findIndex((s) => s.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stars.length || busy) return;

    setBusy(true);
    const a = stars[idx];
    const b = stars[swapIdx];
    const supabase = createClient();

    await Promise.all([
      supabase.from("stars").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("stars").update({ display_order: a.display_order }).eq("id", b.id),
    ]);

    const next = [...stars];
    next[idx] = { ...a, display_order: b.display_order };
    next[swapIdx] = { ...b, display_order: a.display_order };
    next.sort((x, y) => x.display_order - y.display_order);
    setStars(next);
    setBusy(false);
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-navy/20 text-xs tracking-widest uppercase text-navy/50">
          <th className="text-left py-2 pr-4 font-normal w-16">Order</th>
          <th className="text-left py-2 pr-4 font-normal">Name</th>
          <th className="text-left py-2 pr-4 font-normal">Slug</th>
          <th className="text-left py-2 pr-4 font-normal">Rights Risk</th>
          <th className="py-2 font-normal"></th>
        </tr>
      </thead>
      <tbody>
        {stars.map((star, idx) => (
          <tr key={star.id} className="border-b border-navy/10 hover:bg-cream/50">
            <td className="py-3 pr-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(star.id, "up")}
                  disabled={idx === 0 || busy}
                  className="text-navy/30 hover:text-navy disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(star.id, "down")}
                  disabled={idx === stars.length - 1 || busy}
                  className="text-navy/30 hover:text-navy disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                  title="Move down"
                >
                  ▼
                </button>
              </div>
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
        ))}
      </tbody>
    </table>
  );
}
