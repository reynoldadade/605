"use client";

import { useState } from "react";

export function SizePicker({ sizes }: { sizes: string[] }) {
  const [size, setSize] = useState<string | null>(null);
  return (
    <div className="sizes">
      {sizes.map((s) => (
        <SizeButton key={s} size={s} selected={s === size} onPick={setSize} />
      ))}
    </div>
  );
}

function SizeButton({ size, selected, onPick }: {
  size: string; selected: boolean; onPick: (s: string) => void;
}) {
  return (
    <button aria-pressed={selected} onClick={() => onPick(size)}>
      {size}
    </button>
  );
}
