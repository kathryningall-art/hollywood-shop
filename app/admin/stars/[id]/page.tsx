"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/app/admin/ImageUpload";

const RISK_OPTIONS = [
  { value: "low", label: "Low — died 50+ years ago, no estate activity" },
  { value: "medium", label: "Medium — some estate presence, proceed carefully" },
  { value: "high", label: "High — active estate, limited use only" },
  { value: "blocked", label: "Blocked — do not publish looks for this star" },
];

export default function EditStarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    bio: "",
    hero_image_url: "",
    hero_image_credit: "",
    death_year: "",
    publicity_rights_risk: "low",
    publicity_rights_notes: "",
  });

  useEffect(() => {
    params.then(({ id: starId }) => {
      setId(starId);
      const supabase = createClient();
      supabase
        .from("stars")
        .select("*")
        .eq("id", starId)
        .single()
        .then(({ data, error: err }) => {
          if (err || !data) {
            setError("Star not found.");
            setLoading(false);
            return;
          }
          setForm({
            name: data.name ?? "",
            slug: data.slug ?? "",
            bio: data.bio ?? "",
            hero_image_url: data.hero_image_url ?? "",
            hero_image_credit: data.hero_image_credit ?? "",
            death_year: data.death_year ? String(data.death_year) : "",
            publicity_rights_risk: data.publicity_rights_risk ?? "low",
            publicity_rights_notes: data.publicity_rights_notes ?? "",
          });
          setLoading(false);
        });
    });
  }, [params]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase
      .from("stars")
      .update({
        name: form.name,
        slug: form.slug,
        bio: form.bio || null,
        hero_image_url: form.hero_image_url || null,
        hero_image_credit: form.hero_image_credit || null,
        death_year: form.death_year ? parseInt(form.death_year) : null,
        publicity_rights_risk: form.publicity_rights_risk,
        publicity_rights_notes: form.publicity_rights_notes || null,
      })
      .eq("id", id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (loading) {
    return <p className="text-navy/50 text-sm">Loading…</p>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-navy text-2xl mb-8">Edit Star</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className={input}
          />
        </Field>

        <Field label="Slug (URL)" required>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            pattern="[a-z0-9-]+"
            className={`${input} font-mono`}
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={4}
            className={input}
          />
        </Field>

        <Field label="Hero Image URL">
          <input
            type="url"
            value={form.hero_image_url}
            onChange={(e) => set("hero_image_url", e.target.value)}
            className={input}
          />
          <ImageUpload
            currentUrl={form.hero_image_url}
            onUploaded={(url) => set("hero_image_url", url)}
            folder="stars"
          />
        </Field>

        <Field label="Hero Image Credit">
          <input
            type="text"
            value={form.hero_image_credit}
            onChange={(e) => set("hero_image_credit", e.target.value)}
            className={input}
          />
        </Field>

        <Field label="Year of Death">
          <input
            type="number"
            value={form.death_year}
            onChange={(e) => set("death_year", e.target.value)}
            min={1900}
            max={2030}
            className={`${input} w-32`}
          />
        </Field>

        <Field label="Publicity Rights Risk" required>
          <select
            value={form.publicity_rights_risk}
            onChange={(e) => set("publicity_rights_risk", e.target.value)}
            className={input}
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Publicity Rights Notes">
          <textarea
            value={form.publicity_rights_notes}
            onChange={(e) => set("publicity_rights_notes", e.target.value)}
            rows={3}
            className={input}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-navy text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-brass transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy px-4 py-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-navy text-xs tracking-widest uppercase mb-1.5">
        {label}
        {required && <span className="text-brass ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const input =
  "w-full border border-navy/20 px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-brass bg-white";
