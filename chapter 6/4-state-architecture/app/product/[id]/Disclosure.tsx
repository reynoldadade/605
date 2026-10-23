"use client";

import { useState, type ReactNode } from "react";

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>{title}</button>
      {open && children}
    </section>
  );
}
