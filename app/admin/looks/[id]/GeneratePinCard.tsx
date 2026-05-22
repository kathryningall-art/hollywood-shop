"use client";

import { useState, useMemo } from "react";
import { buildPinDescription, getSuggestedBoards, buildLookPublicUrl } from "@/lib/og";

interface GeneratePinCardProps {
  lookId: string;
  lookTitle: string;
  lookSlug: string;
  editorialText: string;
  year: number | null;
  hasImage: boolean;
  starName: string;
  starSlug: string;
}

export default function GeneratePinCard({
  lookId,
  lookTitle,
  lookSlug,
  editorialText,
  year,
  hasImage,
  starName,
  starSlug,
}: GeneratePinCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Compose pin description from current form state — updates live as user edits
  const description = useMemo(
    () =>
      buildPinDescription({
        lookTitle: lookTitle || "Untitled Look",
        starName: starName || "Unknown Star",
        editorialText,
        year,
      }),
    [lookTitle, starName, editorialText, year]
  );

  const suggestedBoards = useMemo(
    () => getSuggestedBoards({ starName: starName || "Star", year }),
    [starName, year]
  );

  const pinUrl = useMemo(
    () =>
      starSlug && lookSlug
        ? buildLookPublicUrl(starSlug, lookSlug)
        : "(save the look to generate a URL)",
    [starSlug, lookSlug]
  );

  const downloadFilename = `${starSlug || "star"}-${lookSlug || "look"}-pin.png`;

  async function handlePreview() {
    setError("");
    setPreviewing(true);
    setPreviewUrl(null);
    try {
      // Cache-bust each click so the preview reflects the latest saved DB state
      const res = await fetch(`/api/pin/${lookId}?v=${Date.now()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const msg = body.detail ? `${body.error}: ${body.detail}` : (body.error ?? `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const blob = await res.blob();
      // Revoke previous object URL if any
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDownload() {
    setError("");
    setDownloading(true);
    try {
      const res = await fetch(`/api/pin/${lookId}?v=${Date.now()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(body.error ?? `Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyDescription() {
    try {
      await navigator.clipboard.writeText(description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(pinUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <div className="border-t border-navy/10 pt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-navy/50">Generate Pin</p>
      </div>

      <div className="border border-navy/15 bg-cream/30 p-5 space-y-5">
        {!hasImage && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
            This look has no hero image. Add one above to enable preview &amp; download.
          </div>
        )}

        {/* Preview + Download buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!hasImage || previewing}
            onClick={handlePreview}
            className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {previewing ? "Generating…" : "Preview Pin"}
          </button>
          <button
            type="button"
            disabled={!hasImage || downloading}
            onClick={handleDownload}
            className="text-xs tracking-widest uppercase text-cream bg-navy hover:bg-brass px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloading ? "Downloading…" : "Download Pin"}
          </button>
        </div>

        {/* Preview image (rendered at 1/3 scale: 333×500) */}
        {previewUrl && (
          <div className="border border-navy/15 bg-white p-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pin preview"
              width={333}
              height={500}
              className="block"
              style={{ width: 333, height: 500 }}
            />
          </div>
        )}

        {/* Pin URL */}
        <div>
          <label className="block text-navy text-xs tracking-widest uppercase mb-1.5">
            Pin URL <span className="text-navy/40 normal-case tracking-normal">(paste into Pinterest&rsquo;s destination URL field)</span>
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={pinUrl}
              className="flex-1 border border-navy/20 px-3 py-2.5 text-navy text-xs font-mono bg-white"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-3 py-2 transition-colors whitespace-nowrap"
            >
              {copiedUrl ? "Copied ✓" : "Copy URL"}
            </button>
          </div>
        </div>

        {/* Pin description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-navy text-xs tracking-widest uppercase">
              Pin Description{" "}
              <span className="text-navy/40 normal-case tracking-normal">
                ({description.length}/500 chars)
              </span>
            </label>
            <button
              type="button"
              onClick={handleCopyDescription}
              className="text-xs tracking-widest uppercase text-brass hover:text-navy border border-brass px-3 py-1.5 transition-colors"
            >
              {copiedDesc ? "Copied ✓" : "Copy Description"}
            </button>
          </div>
          <textarea
            readOnly
            value={description}
            rows={10}
            className="w-full border border-navy/20 px-3 py-2.5 text-navy text-sm bg-white font-mono leading-relaxed"
          />
          <p className="text-navy/40 text-xs mt-1.5">
            Suggested boards: {suggestedBoards.join(" · ")}
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
