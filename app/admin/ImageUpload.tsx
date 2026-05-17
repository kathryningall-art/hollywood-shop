"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/app/actions/uploadImage";

interface Props {
  currentUrl: string;
  onUploaded: (url: string) => void;
  folder?: string;
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const result = await uploadImage(formData);

    if (result.error || !result.url) {
      setUploadError(result.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    onUploaded(result.url);
    setUploading(false);

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Current"
          className="w-16 h-16 object-cover border border-navy/15 flex-shrink-0"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

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
