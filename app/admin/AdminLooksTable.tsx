"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SortableProvider, SortableScope, DragHandle, diffOrder } from "@/app/admin/components/SortableList";

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
      if (a.star_name !== b.star_name) return a.star_name.localeCompare(b.star_name);
      return a.display_order - b.display_order;
    })
  );
  const [busy, setBusy] = useState(false);

  const starNames = Array.from(new Set(looks.map((l) => l.star_name)));

  async function handleReorder(starId: string, nextForStar: Look[]) {
    if (busy) return;
    const prevForStar = looks.filter((l) => l.star_id === starId);
    const updates = diffOrder(prevForStar, nextForStar);
    const renumbered = nextForStar.map((l, i) => ({ ...l, display_order: i }));

    setLooks((prev) => {
      const others = prev.filter((l) => l.star_id !== starId);
      return [...others, ...renumbered].sort((a, b) => {
        if (a.star_name !== b.star_name) return a.star_name.localeCompare(b.star_name);
        return a.display_order - b.display_order;
      });
    });

    setBusy(true);
    try {
      const supabase = createClient();
      await Promise.all(
        updates.map((u) =>
          supabase.from("looks").update({ display_order: u.display_order }).eq("id", u.id)
        )
      );
    } catch (err) {
      console.error("[looks reorder] persist failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {starNames.map((starName) => {
        const starLooks = looks.filter((l) => l.star_name === starName);
        const starId = starLooks[0]?.star_id ?? starName;
        return (
          <section key={starName}>
            <h3 className="font-serif text-navy text-lg mb-2">{starName}</h3>
            <SortableProvider
              items={starLooks}
              onReorder={(next) => handleReorder(starId, next)}
              id={`looks-${starId}`}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-navy/20 text-xs tracking-widest uppercase text-navy/50">
                    <th className="text-left py-2 pr-4 font-normal w-10"></th>
                    <th className="text-left py-2 pr-4 font-normal">Title</th>
                    <th className="text-left py-2 pr-4 font-normal">Year</th>
                    <th className="text-left py-2 pr-4 font-normal">License</th>
                    <th className="text-left py-2 pr-4 font-normal">Status</th>
                    <th className="py-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  <SortableScope items={starLooks}>
                    {(look, { ref, style, handleProps, isDragging }) => (
                      <tr
                        ref={ref}
                        style={style}
                        className={`border-b border-navy/10 ${isDragging ? "bg-cream" : "hover:bg-cream/50"}`}
                      >
                        <td className="py-3 pr-2 align-middle">
                          <DragHandle {...handleProps} />
                        </td>
                        <td className="py-3 pr-4 text-navy font-medium">{look.title}</td>
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
                    )}
                  </SortableScope>
                </tbody>
              </table>
            </SortableProvider>
          </section>
        );
      })}
    </div>
  );
}
