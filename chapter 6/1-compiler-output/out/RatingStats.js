"use client";

import { c as _c } from "react/compiler-runtime";
import { RatingChart } from "./RatingChart";

// Section 4: memoization after an early return, which useMemo can't do.
export function RatingStats(t0) {
  const $ = _c(4);
  const {
    ratings,
    open
  } = t0;
  if (!open) {
    return null;
  }
  let t1;
  if ($[0] !== ratings) {
    t1 = [...ratings].sort(_temp);
    $[0] = ratings;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const sorted = t1;
  let t2;
  if ($[2] !== sorted) {
    t2 = <RatingChart points={sorted} />;
    $[2] = sorted;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
function _temp(a, b) {
  return a - b;
}
