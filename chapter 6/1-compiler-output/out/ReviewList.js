"use client";

import { c as _c } from "react/compiler-runtime";
import { useState } from "react";
import { ReviewItem } from "./ReviewItem";

// Section 3: plain code, no useMemo, useCallback, or React.memo.
export function ReviewList(t0) {
  const $ = _c(16);
  const {
    reviews,
    minRating
  } = t0;
  const [expanded, setExpanded] = useState(false);
  let t1;
  if ($[0] !== expanded || $[1] !== minRating || $[2] !== reviews) {
    let t2;
    if ($[4] !== minRating) {
      t2 = r => r.rating >= minRating;
      $[4] = minRating;
      $[5] = t2;
    } else {
      t2 = $[5];
    }
    const visible = reviews.filter(t2);
    const shown = expanded ? visible : visible.slice(0, 3);
    t1 = shown.map(_temp);
    $[0] = expanded;
    $[1] = minRating;
    $[2] = reviews;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[6] !== t1) {
    t2 = <ul>{t1}</ul>;
    $[6] = t1;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  let t3;
  if ($[8] !== expanded) {
    t3 = () => setExpanded(!expanded);
    $[8] = expanded;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  const t4 = expanded ? "Show fewer" : "Show all";
  let t5;
  if ($[10] !== t3 || $[11] !== t4) {
    t5 = <button onClick={t3}>{t4}</button>;
    $[10] = t3;
    $[11] = t4;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  let t6;
  if ($[13] !== t2 || $[14] !== t5) {
    t6 = <section>{t2}{t5}</section>;
    $[13] = t2;
    $[14] = t5;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  return t6;
}
function _temp(r_0) {
  return <ReviewItem key={r_0.id} review={r_0} />;
}
