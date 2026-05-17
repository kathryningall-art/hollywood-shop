"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Look = {
  id: string;
  title: string;
  year: number | null;
  published: boolean;
  license_verified: boolean;
  star_id: string;
  star_name: string;
  display_order: number;
};

export default function AdminLooksTable({ initialLooks }: { initialLooks: Look[] }) {
  const [looks, setLooks] = useState(
    [...initialLooks].sort((a, b) => {
      // Group by star name, then by display_order within each star
      if (a.star_name !== b.star_name) return a.star_name.localeCompare(b.star_name);
      return a.display_order - b.display_order;
    })
  );
  const [busy, setBusy] = useState(false);

  // Group looks by star for display
  const stars = Array.from(new Set(looks.map((l) => l.star_name)));

  async function move(id: string, direction: "up" | "down") {
    const look = looks.find((l) => l.id === id)!;
    const starLooks = looks.filter((l) => l.star_id === look.star_id);
    const idx = starLooks.findIndex((l) => l.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= starLooks.length || busy) return;

    setBusy(true);
    const a = starLooks[idx];
    const b = starLooks[swapIdx];
    const supabase = createClient();

    await Promise.all([
      supabase.from("looks").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("looks").update({ display_order: a.display_order }).eq("id", b.id),
    ]);

    setLooks((prev) => {
      const next = prev.map((l) => {
        if (l.id === a.id) return { ...l, display_order: b.display_order };
        if (l.id === b.id) return { ...l, display_order: a.display_order };
        return l;
      });
      return next.sort((x, y) => {
        if (x.star_name !== y.star_name) return x.star_name.localeCompare(y.star_name);
        return x.display_order - y.display_order;
      });
    });
    setBusy(false);
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-navy/20 text-xs tracking-widest uppercase text-navy/50">
          <th className="text-left py-2 pr-4 font-normal w-16">Order</th>
          <th className="text-left py-2 pr-4 font-normal">Title</th>
          <th className="text-left py-2 pr-4 font-normal">Star</th>
          <th className="text-left py-2 pr-4 font-normal">Year</th>
          <th className="text-left py-2 pr-4 font-normal">License</th>
          <th className="text-left py-2 pr-4 font-normal">Status</th>
          <th className="py-2 font-normal"></th>
        </tr>
      </thead>
      <tbody>
        {stars.map((starName) => {
          const starLooks = looks.filter((l) => l.star_name === starName);
          return starLooks.map((look, idx) => (
            <tr key={look.id} className="border-b border-navy/10 hover:bg-cream/50">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(look.id, "up")}
                    disabled={idx === 0 || busy}
                    className="text-navy/30 hover:text-navy disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                    title="Move up within star"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(look.id, "down")}
                    disabled={idx === starLooks.length - 1 || busy}
                    className="text-navy/30 hover:text-navy disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
                    title="Move down within star"
                  >
                    ▼
                  </button>
                </div>
              </td>
              <td className="py-3 pr-4 text-navy font-medium">{look.title}</td>
              <td className="py-3 pr-4 text-navy/60 text-xs">{look.star_name}</td>
              <td className="py-3 pr-4 text-navy/60">{look.year ?? "—"}</td>
              <td className="py-3 pr-4">
                {look.license_verified ? (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-sm font-medium">Verified</span>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm font-medium">Unverified</span>
                )}
              </td>
              <td className="py-3 pr-4">
                {look.published ? (
                  <span className="text-xs text-navy bg-brass/20 px-2 py-0.5 rounded-sm font-medium uppercase tracking-wide">Live</span>
                ) : (
                  <span className="text-xs text-navy/40 bg-navy/10 px-2 py-0.5 rounded-sm font-medium uppercase tracking-wide">Draft</span>
                )}
              </td>
              <td className="py-3 text-right">
                <Link href={`/admin/looks/${look.id}`} className="text-xs text-brass hover:text-navy uppercase tracking-widest">
                  Edit
                </Link>
              </td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );
}
