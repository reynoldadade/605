"use client";

import { useEffect, useState } from "react";
import { reportTiming } from "@/lib/report";

export function SizePicker() {
  const [size, setSize] = useState("M");
  // Runs once this island has hydrated (or been rendered on the client).
  useEffect(() => {
    const m = performance.measure("size-picker-ready", "hydration-start");
    reportTiming("size-picker-ready", m.duration);
  }, []);
  return (
    <div role="group" aria-label="Size">
      {["S", "M", "L", "XL"].map((s) => (
        <button key={s} aria-pressed={s === size} onClick={() => setSize(s)}>{s}</button>
      ))}
    </div>
  );
}
