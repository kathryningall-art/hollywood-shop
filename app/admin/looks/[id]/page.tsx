"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateEditorial, type EditorialVariant } from "@/app/actions/generateEditorial";

const LICENSE_OPTIONS = [
  { value: "public_domain_us", label: "Public Domain (US)" },
  { value: "public_domain_pre1928", label: "Public Domain — Pre-1928" },
  { value: "cc0", label: "CC0 — No Rights Reserved" },
  { value: "cc_by", label: "CC BY" },
  { value: "cc_by_sa", label: "CC BY-SA" },
  { value: "cc_by_nd", label: "CC BY-ND" },
  { value: "fair_use_editorial", label: "Fair Use — Editorial" },
  { value: "unknown", label: "Unknown / Unconfirmed" },
];

export default function EditLookPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [stars, setStars] = useState<{ id: string; name: string; publicity_rights_risk: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<EditorialVariant[] | null>(null);
  const [generateError, setGenerateError] = useState("");

  const [form, setForm] = useState({
    star_id: "",
    slug: "",
    title: "",
    year: "",
    image_url: "",
    image_credit: "",
    image_source_url: "",
    image_license: "unknown",
    license_verified: false,
    license_verification_notes: "",
    editorial_text: "",
    published: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("stars")
      .select("id, name, publicity_rights_risk")
      .order("name")
      .then(({ data }) => setStars(data ?? []));

    params.then(({ id: lookId }) => {
      setId(lookId);
      supabase
        .from("looks")
        .select("*")
        .eq("id", lookId)
        .single()
        .then(({ data, error: err }) => {
          if (err || !data) {
            setError("Look not found.");
            setLoading(false);
            return;
          }
          setForm({
            star_id: data.star_id ?? "",
            slug: data.slug ?? "",
            title: data.title ?? "",
            year: data.year ? String(data.year) : "",
            image_url: data.image_url ?? "",
            image_credit: data.image_credit ?? "",
            image_source_url: data.image_source_url ?? "",
            image_license: data.image_license ?? "unknown",
            license_verified: data.license_verified ?? false,
            license_verification_notes: data.license_verification_notes ?? "",
            editorial_text: data.editorial_text ?? "",
            published: data.published ?? false,
          });
          setLoading(false);
        });
    });
  }, [params]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const year = parseInt(form.year) || 0;
  const selectedStar = stars.find((s) => s.id === form.star_id);

  const eraWarning =
    year >= 1964
      ? { level: "red", text: "1964 or later — publicity rights may apply in some states. Verify carefully before publishing." }
      : year >= 1930
      ? { level: "yellow", text: "1930–1963 — check for any active estate or publicity rights claims." }
      : null;

  const starBlocked = selectedStar?.publicity_rights_risk === "blocked";
  const canPublish = form.license_verified && !starBlocked;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (form.published && !canPublish) {
      setError(
        starBlocked
          ? "Cannot publish: this star is blocked due to publicity rights concerns."
          : "Cannot publish without verifying the image license first."
      );
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase
      .from("looks")
      .update({
        star_id: form.star_id,
        slug: form.slug,
        title: form.title,
        year: year || null,
        image_url: form.image_url || null,
        image_credit: form.image_credit || null,
        image_source_url: form.image_source_url || null,
        image_license: form.image_license,
        license_verified: form.license_verified,
        license_verification_notes: form.license_verification_notes || null,
        editorial_text: form.editorial_text || "",
        published: form.published,
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-navy text-2xl">Edit Look</h1>
        {id && (
          <Link
            href={`/admin/looks/${id}/products`}
            className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-4 py-2 transition-colors"
          >
            Manage Products
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Star" required>
          <select
            value={form.star_id}
            onChange={(e) => set("star_id", e.target.value)}
            required
            className={input}
          >
            <option value="">Select a star…</option>
            {stars.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.publicity_rights_risk === "blocked" ? " ⛔ blocked" : ""}
                {s.publicity_rights_risk === "high" ? " ⚠ high risk" : ""}
              </option>
            ))}
          </select>
          {starBlocked && (
            <p className="mt-2 text-sm text-red-700 bg-red-50 px-3 py-2 border border-red-200">
              This star is blocked — looks cannot be published for them.
            </p>
          )}
        </Field>

        <Field label="Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
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

        <Field label="Year" required>
          <input
            type="number"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            required
            min={1900}
            max={1970}
            className={`${input} w-32`}
          />
          {eraWarning && (
            <p
              className={`mt-2 text-sm px-3 py-2 border ${
                eraWarning.level === "red"
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              {eraWarning.text}
            </p>
          )}
        </Field>

        <div className="border-t border-navy/10 pt-6">
          <p className="text-xs tracking-widest uppercase text-navy/50 mb-4">Image</p>
          <div className="space-y-4">
            <Field label="Image URL">
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Image Credit">
              <input
                type="text"
                value={form.image_credit}
                onChange={(e) => set("image_credit", e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Image Source URL" hint="Link to the Commons/archive page">
              <input
                type="url"
                value={form.image_source_url}
                onChange={(e) => set("image_source_url", e.target.value)}
                className={input}
              />
            </Field>
            <Field label="License" required>
              <select
                value={form.image_license}
                onChange={(e) => set("image_license", e.target.value)}
                className={input}
              >
                {LICENSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="border border-navy/20 p-4 space-y-4 bg-cream/30">
          <p className="text-xs tracking-widest uppercase text-navy/60">License Verification</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.license_verified}
              onChange={(e) => set("license_verified", e.target.checked)}
              className="mt-0.5 accent-navy"
            />
            <span className="text-sm text-navy">
              I have personally verified this image is free to use under the stated license,
              and I have confirmed the source page.
            </span>
          </label>
          <Field label="Verification Notes">
            <textarea
              value={form.license_verification_notes}
              onChange={(e) => set("license_verification_notes", e.target.value)}
              rows={3}
              className={input}
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-navy text-xs tracking-widest uppercase">
              Editorial Text
            </label>
            <button
              type="button"
              disabled={generating || !form.image_url}
              onClick={async () => {
                setGenerating(true);
                setGenerateError("");
                setVariants(null);
                const result = await generateEditorial({
                  imageUrl: form.image_url,
                  starName: stars.find((s) => s.id === form.star_id)?.name ?? "",
                  year: parseInt(form.year) || null,
                  title: form.title,
                });
                setGenerating(false);
                if (result.success) {
                  setVariants(result.variants);
                } else {
                  setGenerateError(result.error);
                }
              }}
              className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={!form.image_url ? "Add an image URL first" : ""}
            >
              {generating ? "Generating…" : "Generate editorial"}
            </button>
          </div>
          <textarea
            value={form.editorial_text}
            onChange={(e) => set("editorial_text", e.target.value)}
            rows={5}
            className={input}
          />
          {generateError && (
            <p className="mt-2 text-sm text-red-600">{generateError}</p>
          )}
          {variants && (
            <div className="mt-3 space-y-2">
              {variants.map((v) => (
                <div key={v.voice} className="border border-navy/15 bg-cream/60 p-3">
                  <p className="text-xs tracking-widest uppercase text-navy/40 mb-1 capitalize">
                    {v.voice}
                  </p>
                  <p className="text-navy text-sm leading-relaxed">{v.text}</p>
                  <button
                    type="button"
                    onClick={() => {
                      set("editorial_text", v.text);
                      setVariants(null);
                    }}
                    className="mt-2 text-xs tracking-widest uppercase text-brass hover:text-navy transition-colors"
                  >
                    Use this ↑
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  setGenerateError("");
                  setVariants(null);
                  const result = await generateEditorial({
                    imageUrl: form.image_url,
                    starName: stars.find((s) => s.id === form.star_id)?.name ?? "",
                    year: parseInt(form.year) || null,
                    title: form.title,
                  });
                  setGenerating(false);
                  if (result.success) {
                    setVariants(result.variants);
                  } else {
                    setGenerateError(result.error);
                  }
                }}
                className="text-xs tracking-widest uppercase text-navy/50 hover:text-navy transition-colors disabled:opacity-40"
              >
                Regenerate
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-navy/10 pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              disabled={!canPublish}
              className="mt-0.5 accent-navy disabled:opacity-40"
            />
            <span className={`text-sm ${canPublish ? "text-navy" : "text-navy/40"}`}>
              Publish this look (make it visible on the site)
            </span>
          </label>
          {!form.license_verified && (
            <p className="mt-2 text-xs text-navy/50 ml-6">
              You must verify the license before publishing.
            </p>
          )}
        </div>

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
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-navy text-xs tracking-widest uppercase mb-1.5">
        {label}
        {required && <span className="text-brass ml-1">*</span>}
      </label>
      {hint && <p className="text-navy/50 text-xs mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const input =
  "w-full border border-navy/20 px-3 py-2.5 text-navy text-sm focus:outline-none focus:border-brass bg-white";
