"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

// The current time is state, updated by an interval: an input that changes
// on purpose, not a value read in passing during render.
export function SaleCountdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <p className="deal">{now === null ? " " : formatCountdown(endsAt - now)}</p>;
}
