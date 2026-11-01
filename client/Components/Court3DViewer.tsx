"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;          // .glb URL (template ya owner ka scan)
  alt?: string;
  height?: number;
};

// Google <model-viewer>: ek HTML tag jo .glb render karta hai — orbit, zoom, auto-rotate built-in.
// Web component hai, isliye browser pe hi load hota hai (SSR pe `customElements` nahi hota).
const Court3DViewer = ({ src, alt = "3D view of the court", height = 420 }: Props) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ height }} className="flex items-center justify-center border rounded-md bg-gray-50">
        <p className="text-sm text-gray-600">Loading 3D viewer...</p>
      </div>
    );
  }

  return (
    // @ts-expect-error — model-viewer custom element, React ko iski types nahi pata
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      style={{ width: "100%", height: `${height}px`, borderRadius: "8px", background: "#f3f4f6" }}
    />
  );
};

export default Court3DViewer;