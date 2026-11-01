"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { removeCourtModel, uploadCourtModel } from "@/services/courts";

type Props = {
  courtId: string;
  hasModel: boolean;        // owner ka apna scan hai ya template dikh raha hai
  onChanged: () => void;    // parent court dobara load kare
};

const MAX_MB = 50;

const CourtModelUpload = ({ courtId, hasModel, onChanged }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick checks — backend bhi check karta hai, ye sirf fast feedback ke liye
    if (!file.name.toLowerCase().endsWith(".glb")) {
      toast.error("Only .glb files are allowed");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB`);
      return;
    }

    setBusy(true);
    try {
      await uploadCourtModel(courtId, file);
      toast.success("3D model uploaded");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = ""; // same file dobara choose ho sake
    }
  }; 

  const handleRemove = async () => {
if (!window.confirm("Remove the 3D scan from this court?")) return;
    setBusy(true);
    try {
      await removeCourtModel(courtId);
      toast.success("3D model removed");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        onChange={handleFile}
        className="hidden"
        id={`model-upload-${courtId}`}
      />
      <label
        htmlFor={`model-upload-${courtId}`}
        className={`border rounded-md px-3 py-1.5 text-sm cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}
      >
{busy ? "Uploading..." : hasModel ? "Replace 3D scan" : "Add 3D scan (.glb)"}
      </label>
      {hasModel && (
        <button
          onClick={handleRemove}
          disabled={busy}
          className="text-sm text-red-600 underline disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default CourtModelUpload;