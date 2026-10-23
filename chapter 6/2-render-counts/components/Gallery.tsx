"use client";

import { useState } from "react";

export function Gallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="gallery">
      {images.map((img, i) => (
        <Thumb key={img} label={img} active={i === selected} onSelect={() => setSelected(i)} />
      ))}
    </div>
  );
}

function Thumb({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button className="thumb" aria-pressed={active} onClick={onSelect}>
      {label}
    </button>
  );
}
