"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveShortlist } from "@/app/actions/saveShortlist";

export type SeenBefore = {
  type: "shortlisted" | "surfaced";
  look_title: string;
  look_id: string;
  more_count: number;
};

export type ProposalTile = {
  id: string;
  slot_label: string;
  product_url: string;
  image_url: string;
  title: string;
  price: string;
  retailer: string;
  source_queries: string[];
  seen_before: SeenBefore | null;
};

type Props = {
  lookId: string;
  slotOrder: string[];
  tiles: ProposalTile[];
};

type PriceBucket = "any" | "under50" | "50to150" | "150to500" | "over500";

const PRICE_BUCKETS: { value: PriceBucket; label: string; test: (n: number | null) => boolean }[] = [
  { value: "any",       label: "Any price",  test: () => true },
  { value: "under50",   label: "Under $50",  test: (n) => n != null && n < 50 },
  { value: "50to150",   label: "$50–150",    test: (n) => n != null && n >= 50 && n < 150 },
  { value: "150to500",  label: "$150–500",   test: (n) => n != null && n >= 150 && n < 500 },
  { value: "over500",   label: "$500+",      test: (n) => n != null && n >= 500 },
];

function parsePriceNumber(p: string): number | null {
  const m = p.match(/(\d{1,5})(?:[.,](\d{2}))?/);
  if (!m) return null;
  return parseFloat(`${m[1]}.${m[2] ?? "0"}`);
}

export default function ProposalsReview({ lookId, slotOrder, tiles }: Props) {
  const router = useRouter();
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [retailerFilter, setRetailerFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<PriceBucket>("any");
  const [queryFilter, setQueryFilter] = useState<string>("");
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  // Build retailer + query option lists.
  const retailers = useMemo(() => {
    const s = new Set<string>();
    tiles.forEach((t) => t.retailer && s.add(t.retailer));
    return Array.from(s).sort();
  }, [tiles]);
  const queries = useMemo(() => {
    const s = new Set<string>();
    tiles.forEach((t) => t.source_queries.forEach((q) => s.add(q)));
    return Array.from(s).sort();
  }, [tiles]);

  // Filter + flatten ordered by slot.
  const filteredBySlot = useMemo(() => {
    const bucket = PRICE_BUCKETS.find((b) => b.value === priceFilter)!;
    const result: { slot: string; tiles: ProposalTile[] }[] = [];
    for (const slot of slotOrder) {
      const matching = tiles.filter((t) => {
        if (t.slot_label !== slot) return false;
        if (retailerFilter && t.retailer !== retailerFilter) return false;
        if (queryFilter && !t.source_queries.includes(queryFilter)) return false;
        if (!bucket.test(parsePriceNumber(t.price))) return false;
        return true;
      });
      if (matching.length > 0) result.push({ slot, tiles: matching });
    }
    return result;
  }, [tiles, slotOrder, retailerFilter, priceFilter, queryFilter]);

  // Flat list for keyboard nav, in render order.
  const flatTiles = useMemo(
    () => filteredBySlot.flatMap((s) => s.tiles),
    [filteredBySlot]
  );

  const shortlistedSlots = useMemo(() => {
    const s = new Set<string>();
    tiles.forEach((t) => {
      if (shortlisted.has(t.id)) s.add(t.slot_label);
    });
    return s;
  }, [tiles, shortlisted]);

  const toggleTile = useCallback((id: string) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError("");
    const result = await saveShortlist({
      lookId,
      shortlistIds: Array.from(shortlisted),
    });
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error);
      return;
    }
    router.push(result.redirect);
  }, [lookId, shortlisted, router]);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in form fields.
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving && shortlisted.size > 0) handleSave();
        return;
      }
      if (flatTiles.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(flatTiles.length - 1, i + 1));
      } else if (e.key === "k" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (e.key === " ") {
        e.preventDefault();
        const tile = flatTiles[focusIndex];
        if (tile) toggleTile(tile.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatTiles, focusIndex, toggleTile, handleSave, saving, shortlisted.size]);

  // Scroll focused tile into view.
  useEffect(() => {
    const tile = flatTiles[focusIndex];
    if (!tile || !gridRef.current) return;
    const el = gridRef.current.querySelector(`[data-tile-id="${tile.id}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusIndex, flatTiles]);

  return (
    <>
      {/* Sticky save bar */}
      <div className="sticky top-0 z-30 bg-cream border-b border-navy/15 px-6 py-3 flex items-center gap-4 shadow-sm">
        <div className="flex-1">
          <p className="font-serif text-navy text-base">
            {shortlisted.size} shortlisted across {shortlistedSlots.size} slot
            {shortlistedSlots.size === 1 ? "" : "s"}
          </p>
          <p className="text-navy/50 text-xs">
            J/K or arrows to move · Space to toggle · Ctrl+Enter to save
          </p>
        </div>
        {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
        <button
          onClick={handleSave}
          disabled={saving || shortlisted.size === 0}
          className="bg-navy text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass transition-colors disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Shortlist"}
        </button>
      </div>

      {/* Filter chips */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-2 border-b border-navy/10">
        <span className="text-xs tracking-widest uppercase text-navy/40 mr-2">Filter</span>
        <select
          value={retailerFilter}
          onChange={(e) => setRetailerFilter(e.target.value)}
          className="text-xs border border-navy/20 px-2 py-1 bg-white text-navy focus:outline-none focus:border-brass"
        >
          <option value="">All retailers</option>
          {retailers.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as PriceBucket)}
          className="text-xs border border-navy/20 px-2 py-1 bg-white text-navy focus:outline-none focus:border-brass"
        >
          {PRICE_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <select
          value={queryFilter}
          onChange={(e) => setQueryFilter(e.target.value)}
          className="text-xs border border-navy/20 px-2 py-1 bg-white text-navy focus:outline-none focus:border-brass max-w-xs"
        >
          <option value="">All queries</option>
          {queries.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        {(retailerFilter || priceFilter !== "any" || queryFilter) && (
          <button
            onClick={() => {
              setRetailerFilter("");
              setPriceFilter("any");
              setQueryFilter("");
            }}
            className="text-xs text-navy/50 hover:text-navy"
          >
            Clear
          </button>
        )}
      </div>

      <div ref={gridRef} className="px-6 py-6 space-y-10">
        {filteredBySlot.length === 0 && (
          <p className="text-navy/50 text-sm">No tiles match these filters.</p>
        )}
        {filteredBySlot.map(({ slot, tiles: slotTiles }) => (
          <section key={slot}>
            <h2 className="font-serif text-navy text-xl mb-3">
              {slot}{" "}
              <span className="text-navy/40 text-sm font-sans">({slotTiles.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {slotTiles.map((tile) => {
                const flatIdx = flatTiles.findIndex((t) => t.id === tile.id);
                return (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    shortlisted={shortlisted.has(tile.id)}
                    focused={flatIdx === focusIndex}
                    onClick={() => {
                      setFocusIndex(flatIdx);
                      toggleTile(tile.id);
                    }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function Tile({
  tile,
  shortlisted,
  focused,
  onClick,
}: {
  tile: ProposalTile;
  shortlisted: boolean;
  focused: boolean;
  onClick: () => void;
}) {
  const ring = shortlisted
    ? "outline outline-2 outline-brass outline-offset-2"
    : focused
    ? "outline outline-2 outline-navy/40 outline-offset-2"
    : "";

  const badge =
    tile.seen_before?.type === "shortlisted"
      ? { text: `Shortlisted for ${tile.seen_before.look_title}`, bg: "bg-brass/90 text-cream" }
      : tile.seen_before?.type === "surfaced"
      ? { text: `Surfaced for ${tile.seen_before.look_title} — not selected`, bg: "bg-navy/70 text-cream" }
      : null;

  return (
    <button
      type="button"
      data-tile-id={tile.id}
      onClick={onClick}
      className={`group text-left relative ${ring}`}
      title={
        tile.seen_before && tile.seen_before.more_count > 0
          ? `+${tile.seen_before.more_count} more cross-look matches`
          : undefined
      }
    >
      <div className="relative aspect-square bg-navy/5 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tile.image_url}
          alt={tile.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {shortlisted && (
          <div className="absolute top-1 right-1 bg-brass text-cream w-6 h-6 flex items-center justify-center text-sm">
            ✓
          </div>
        )}
        {badge && (
          <div className={`absolute bottom-1 left-1 right-1 text-[10px] px-1.5 py-1 ${badge.bg} truncate`}>
            {badge.text}
            {tile.seen_before && tile.seen_before.more_count > 0 && (
              <span className="ml-1 opacity-70">+{tile.seen_before.more_count}</span>
            )}
          </div>
        )}
      </div>
      <div className="p-1.5">
        <p className="text-navy text-xs leading-snug line-clamp-2">{tile.title}</p>
        <div className="flex items-center justify-between mt-1 text-[11px]">
          {tile.price ? (
            <span className="text-navy/70 font-medium">{tile.price}</span>
          ) : (
            <span />
          )}
          <span className="text-navy/40 truncate ml-1">{tile.retailer}</span>
        </div>
      </div>
    </button>
  );
}
