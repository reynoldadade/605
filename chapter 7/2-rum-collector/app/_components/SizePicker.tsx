"use client";

import { useState } from "react";

export function SizePicker() {
  const [size, setSize] = useState("M");
  return (
    <div role="group" aria-label="Size">
      {["S", "M", "L"].map((s) => (
        <button key={s} aria-pressed={s === size} onClick={() => setSize(s)}>{s}</button>
      ))}
    </div>
  );
}
