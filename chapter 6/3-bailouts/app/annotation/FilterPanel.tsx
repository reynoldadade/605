"use client";

import { useState } from "react";

export type FilterPanelProps = { categories: string[]; onChange: (c: string[]) => void };

// Opted in explicitly. With compilationMode: "annotation", only functions
// carrying "use memo" are compiled (npm run compile-report:annotation).
export default function FilterPanel({ categories, onChange }: FilterPanelProps) {
  "use memo";
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(c: string) {
    const next = picked.includes(c) ? picked.filter((p) => p !== c) : [...picked, c];
    setPicked(next);
    onChange(next);
  }

  return (
    <fieldset>
      {categories.map((c) => (
        <label key={c}>
          <input type="checkbox" checked={picked.includes(c)} onChange={() => toggle(c)} /> {c}
        </label>
      ))}
    </fieldset>
  );
}
