"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder?: string; // e.g. "looks" or "stars"
}

export default function ImageUpload({ currentUrl, onUploaded, folder = "misc" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const ext = file.name.split(".").pop();
    const filename = `${folder}/${Date.now()}.${ext}`;

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filename, file, { upsert: true });

    if (error || !data) {
      setUploadError(error?.message ?? "Upload failed");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);

    onUploaded(publicUrl);
    setUploading(false);

    // reset so the same file can be re-uploaded if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      {/* Preview */}
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Current"
          className="w-16 h-16 object-cover border border-navy/15 flex-shrink-0"
        />
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Upload button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="text-xs tracking-widest uppercase border border-navy/30 px-3 py-2 text-navy/60 hover:text-navy hover:border-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading…" : currentUrl ? "Replace image" : "Upload image"}
      </button>

      {uploadError && (
        <p className="text-red-600 text-xs">{uploadError}</p>
      )}
    </div>
  );
}
