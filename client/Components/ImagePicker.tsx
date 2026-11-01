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
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative w-24 h-24">
            <img src={url} alt="" className="w-full h-full object-cover rounded-md border" />
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRemove(url)}
              className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs leading-none disabled:opacity-50"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <label
            className={`w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center text-sm cursor-pointer ${
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
      <p className="text-xs text-gray-500">
        {images.length}/{max} photos · JPG, PNG or WebP · max {MAX_MB} MB each
      </p>
    </div>
  );
};

export default ImagePicker;