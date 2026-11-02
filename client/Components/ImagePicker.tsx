"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  images: string[];                                   // current URLs
  onChange: (images: string[]) => void | Promise<void>; // nayi list parent ko
  upload: (files: File[]) => Promise<{ urls: string[] }>;
  max?: number;
};

const MAX_MB = 5;

const ImagePicker = ({ images, onChange, upload, max = 6 }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > max) {
      toast.error(`Maximum ${max} photos`);
      e.target.value = "";
      return;
    }
    if (files.some((f) => f.size > MAX_MB * 1024 * 1024)) {
      toast.error(`Each photo must be under ${MAX_MB} MB`);
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const { urls } = await upload(files);
      await onChange([...images, ...urls]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (url: string) => {
    setBusy(true);
    try {
      await onChange(images.filter((u) => u !== url));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative h-24 w-24">
            <img
              src={url}
              alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`}
              className="h-full w-full rounded-2xl border border-line object-cover"
            />
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-lime px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink">
                Cover
              </span>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRemove(url)}
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-pill bg-ink text-[10px] leading-none text-white transition hover:bg-danger disabled:opacity-50"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <label
            className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-mist/50 text-sm font-medium text-muted transition hover:border-ink hover:text-ink ${
              busy ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {busy ? "..." : "+ Add"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted">
        {images.length}/{max} photos · JPG, PNG or WebP · max {MAX_MB} MB each
      </p>
    </div>
  );
};

export default ImagePicker;
