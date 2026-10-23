"use client";

import { RatingChart } from "./RatingChart";

// Section 4: memoization after an early return, which useMemo can't do.
export function RatingStats({ ratings, open }: { ratings: number[]; open: boolean }) {
  if (!open) return null;

  const sorted = [...ratings].sort((a, b) => a - b);
  return <RatingChart points={sorted} />;
}
