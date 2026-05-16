"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FrameSwatch, type MatchTier } from "@/app/components/ProductFrame";
import { suggestProducts, type ProductSuggestion } from "@/app/actions/suggestProducts";

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string;
  price_display: string;
  affiliate_url: string;
  network: string;
  display_order: number;
  match_tier: MatchTier;
};

type LookMeta = {
  title: string;
  year: number | null;
  image_url: string | null;
  editorial_text: string | null;
  star_name: string;
};

const NETWORK_OPTIONS = ["amazon", "etsy", "nordstrom", "shareasale", "impact", "rakuten", "direct"];

const TIER_OPTIONS: { value: MatchTier; label: string; desc: string }[] = [
  { value: "original_era",         label: "Original Era",         desc: "Genuine vintage from the period" },
  { value: "vintage_reproduction", label: "Vintage Reproduction", desc: "Made today in period style" },
  { value: "modern_inspired",      label: "Modern Inspired",      desc: "Contemporary, inspired by the look" },
];

const EMPTY_PRODUCT = {
  title: "",
  retailer: "",
  image_url: "",
  price_display: "",
  affiliate_url: "",
  network: "etsy",
  display_order: 0,
  match_tier: "modern_inspired" as MatchTier,
};

export default function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [lookId, setLookId] = useState("");
  const [lookMeta, setLookMeta] = useState<LookMeta | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // AI suggest state
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[] | null>(null);
  const [suggestError, setSuggestError] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setLookId(id);
      const supabase = createClient();
      Promise.all([
        supabase
          .from("looks")
          .select("title, year, image_url, editorial_text, stars(name)")
          .eq("id", id)
          .single(),
        supabase.from("products").select("*").eq("look_id", id).order("display_order"),
      ]).then(([{ data: look }, { data: prods }]) => {
        if (look) {
          setLookMeta({
            title: look.title ?? "",
            year: look.year ?? null,
            image_url: look.image_url ?? null,
            editorial_text: look.editorial_text ?? null,
            star_name: (look.stars as unknown as { name: string } | null)?.name ?? "",
          });
        }
        setProducts(prods ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startNew(prefill?: Partial<typeof EMPTY_PRODUCT>) {
    setForm({ ...EMPTY_PRODUCT, display_order: products.length + 1, ...prefill });
    setEditingId("new");
    setError("");
    setSuggestions(null);
  }

  function startEdit(p: Product) {
    setForm({
      title: p.title,
      retailer: p.retailer,
      image_url: p.image_url ?? "",
      price_display: p.price_display ?? "",
      affiliate_url: p.affiliate_url,
      network: p.network,
      display_order: p.display_order,
      match_tier: p.match_tier ?? "modern_inspired",
    });
    setEditingId(p.id);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function saveProduct() {
    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = {
      look_id: lookId,
      title: form.title,
      retailer: form.retailer,
      image_url: form.image_url || "",
      price_display: form.price_display || null,
      affiliate_url: form.affiliate_url,
      network: form.network,
      display_order: form.display_order,
      match_tier: form.match_tier,
    };

    let err;
    if (editingId === "new") {
      ({ error: err } = await supabase.from("products").insert(payload));
    } else {
      ({ error: err } = await supabase.from("products").update(payload).eq("id", editingId));
    }

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("look_id", lookId)
      .order("display_order");
    setProducts(data ?? []);
    setEditingId(null);
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSuggest() {
    if (!lookMeta?.image_url) return;
    setSuggesting(true);
    setSuggestError("");
    setSuggestions(null);
    const result = await suggestProducts({
      imageUrl: lookMeta.image_url,
      starName: lookMeta.star_name,
      year: lookMeta.year,
      title: lookMeta.title,
      editorialText: lookMeta.editorial_text ?? "",
    });
    setSuggesting(false);
    if (result.success) {
      setSuggestions(result.suggestions);
    } else {
      setSuggestError(result.error);
    }
  }

  if (loading) return <p className="text-navy/50 text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/admin/looks/${lookId}`} className="text-xs text-brass hover:text-navy uppercase tracking-widest">
          ← Back to Look
        </Link>
      </div>
      <h1 className="font-serif text-navy text-2xl mb-1">Products</h1>
      {lookMeta?.title && <p className="text-navy/50 text-sm mb-8">{lookMeta.title}</p>}

      {/* Product list */}
      <div className="space-y-3 mb-6">
        {products.length === 0 && editingId !== "new" && (
          <p className="text-navy/40 text-sm italic">No products yet.</p>
        )}

        {products.map((p) =>
          editingId === p.id ? (
            <ProductForm
              key={p.id}
              form={form}
              set={set}
              onSave={saveProduct}
              onCancel={cancelEdit}
              saving={saving}
              error={error}
            />
          ) : (
            <div
              key={p.id}
              className="border border-navy/10 px-4 py-3 flex items-center gap-4 bg-white hover:border-navy/20"
            >
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-12 h-12 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-navy text-sm font-medium truncate">{p.title}</p>
                <p className="text-navy/50 text-xs">
                  {p.retailer} · {p.network} · {p.price_display || "no price"} · order {p.display_order}
                </p>
                <p className="text-navy/40 text-xs capitalize">{(p.match_tier ?? "modern_inspired").replace(/_/g, " ")}</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => startEdit(p)} className="text-xs text-brass hover:text-navy uppercase tracking-widest">
                  Edit
                </button>
                <button onClick={() => deleteProduct(p.id)} className="text-xs text-navy/30 hover:text-red-600 uppercase tracking-widest">
                  Delete
                </button>
              </div>
            </div>
          )
        )}

        {editingId === "new" && (
          <ProductForm
            form={form}
            set={set}
            onSave={saveProduct}
            onCancel={cancelEdit}
            saving={saving}
            error={error}
            isNew
          />
        )}
      </div>

      {editingId === null && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => startNew()}
            className="bg-navy text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass transition-colors"
          >
            + Add Product
          </button>
          <button
            onClick={handleSuggest}
            disabled={suggesting || !lookMeta?.image_url}
            className="border border-brass text-brass text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass hover:text-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={!lookMeta?.image_url ? "Add an image URL to the look first" : ""}
          >
            {suggesting ? "Suggesting…" : "Suggest Products"}
          </button>
        </div>
      )}

      {suggestError && <p className="mt-3 text-red-600 text-sm">{suggestError}</p>}

      {/* AI suggestions panel */}
      {suggestions && editingId === null && (
        <div className="mt-6 border border-brass/30 bg-cream/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs tracking-widest uppercase text-navy/60">Suggested Products</p>
            <button onClick={() => setSuggestions(null)} className="text-navy/30 hover:text-navy text-lg leading-none">×</button>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 border border-navy/10 bg-white p-3">
                <FrameSwatch tier={s.match_tier} />
                <div className="flex-1 min-w-0">
                  <p className="text-navy text-sm font-medium">{s.title}</p>
                  <p className="text-navy/50 text-xs">{s.retailer} · {s.network} · {s.match_tier.replace(/_/g, " ")}</p>
                  <p className="text-navy/40 text-xs italic mt-0.5">Search: {s.search_hint}</p>
                </div>
                <button
                  onClick={() =>
                    startNew({
                      title: s.title,
                      retailer: s.retailer,
                      network: s.network,
                      match_tier: s.match_tier,
                    })
                  }
                  className="text-xs text-brass hover:text-navy uppercase tracking-widest flex-shrink-0"
                >
                  Use ↑
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleSuggest}
            disabled={suggesting}
            className="mt-4 text-xs tracking-widest uppercase text-navy/50 hover:text-navy transition-colors disabled:opacity-40"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

function ProductForm({
  form,
  set,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
}: {
  form: typeof EMPTY_PRODUCT;
  set: (field: string, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  isNew?: boolean;
}) {
  return (
    <div className="border border-brass/40 bg-cream/30 p-5 space-y-4">
      <p className="text-xs tracking-widest uppercase text-navy/50">
        {isNew ? "New Product" : "Edit Product"}
      </p>

      {/* Tier selector */}
      <div>
        <label className={label}>Tier *</label>
        <div className="flex flex-col gap-2">
          {TIER_OPTIONS.map((t) => (
            <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="match_tier"
                value={t.value}
                checked={form.match_tier === t.value}
                onChange={() => set("match_tier", t.value)}
                className="accent-navy mt-0.5"
              />
              <FrameSwatch tier={t.value} />
              <div>
                <p className="text-navy text-sm font-medium leading-none">{t.label}</p>
                <p className="text-navy/50 text-xs mt-0.5">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={label}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            className={input}
          />
        </div>

        <div>
          <label className={label}>Retailer *</label>
          <input
            type="text"
            value={form.retailer}
            onChange={(e) => set("retailer", e.target.value)}
            className={input}
            placeholder="e.g. Amazon, Etsy"
          />
        </div>

        <div>
          <label className={label}>Network *</label>
          <select value={form.network} onChange={(e) => set("network", e.target.value)} className={input}>
            {NETWORK_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className={label}>Affiliate URL *</label>
          <input
            type="url"
            value={form.affiliate_url}
            onChange={(e) => set("affiliate_url", e.target.value)}
            required
            className={input}
          />
        </div>

        <div>
          <label className={label}>Price Display</label>
          <input
            type="text"
            value={form.price_display}
            onChange={(e) => set("price_display", e.target.value)}
            className={input}
            placeholder="e.g. $42"
          />
        </div>

        <div>
          <label className={label}>Display Order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => set("display_order", parseInt(e.target.value) || 0)}
            min={0}
            className={input}
          />
        </div>

        <div className="col-span-2">
          <label className={label}>Product Image URL</label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
            className={input}
            placeholder="https://…"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-navy text-cream text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-brass transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy px-4 py-2.5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const input =
  "w-full border border-navy/20 px-3 py-2 text-navy text-sm focus:outline-none focus:border-brass bg-white";
const label = "block text-navy text-xs tracking-widest uppercase mb-1.5";
