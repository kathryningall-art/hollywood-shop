"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  title: string;
  retailer: string;
  image_url: string;
  price_display: string;
  affiliate_url: string;
  network: string;
  display_order: number;
};

const NETWORK_OPTIONS = [
  "amazon",
  "etsy",
  "nordstrom",
  "shareasale",
  "impact",
  "rakuten",
  "direct",
];

const EMPTY_PRODUCT = {
  title: "",
  retailer: "",
  image_url: "",
  price_display: "",
  affiliate_url: "",
  network: "amazon",
  display_order: 0,
};

export default function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [lookId, setLookId] = useState("");
  const [lookTitle, setLookTitle] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setLookId(id);
      const supabase = createClient();
      Promise.all([
        supabase.from("looks").select("title").eq("id", id).single(),
        supabase.from("products").select("*").eq("look_id", id).order("display_order"),
      ]).then(([{ data: look }, { data: prods }]) => {
        setLookTitle(look?.title ?? "");
        setProducts(prods ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startNew() {
    setForm({ ...EMPTY_PRODUCT, display_order: products.length + 1 });
    setEditingId("new");
    setError("");
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
      image_url: form.image_url || null,
      price_display: form.price_display || null,
      affiliate_url: form.affiliate_url,
      network: form.network,
      display_order: form.display_order,
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

  if (loading) return <p className="text-navy/50 text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/admin/looks/${lookId}`} className="text-xs text-brass hover:text-navy uppercase tracking-widest">
          ← Back to Look
        </Link>
      </div>
      <h1 className="font-serif text-navy text-2xl mb-1">Products</h1>
      {lookTitle && <p className="text-navy/50 text-sm mb-8">{lookTitle}</p>}

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
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="w-12 h-12 object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-navy text-sm font-medium truncate">{p.title}</p>
                <p className="text-navy/50 text-xs">
                  {p.retailer} · {p.network} · {p.price_display || "no price"} · order {p.display_order}
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs text-brass hover:text-navy uppercase tracking-widest"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-xs text-navy/30 hover:text-red-600 uppercase tracking-widest"
                >
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
        <button
          onClick={startNew}
          className="bg-navy text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass transition-colors"
        >
          + Add Product
        </button>
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
          <select
            value={form.network}
            onChange={(e) => set("network", e.target.value)}
            className={input}
          >
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
