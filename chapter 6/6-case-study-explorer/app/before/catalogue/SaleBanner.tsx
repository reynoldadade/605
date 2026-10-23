"use client";

import { SALE_ENDS_AT } from "@/lib/catalog";
import { formatCountdown } from "@/lib/format";

// Reads the clock during render. Without the compiler it looked like a
// live countdown, because the page re-rendered on almost every interaction.
export function SaleBanner() {
  const msLeft = SALE_ENDS_AT - Date.now();
  return <p className="deal">Sale: {formatCountdown(msLeft)}</p>;
}
