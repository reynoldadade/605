"use client";

// A component defined inside another one gets a new identity on every
// render, so React remounts it and its state is lost each time.
export function Outer({ label }: { label: string }) {
  function Inner() {
    return <span>{label}</span>;
  }
  return <div><Inner /></div>;
}
