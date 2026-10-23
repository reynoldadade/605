"use client";

import { c as _c } from "react/compiler-runtime";
export function ReviewItem(t0) {
  const $ = _c(5);
  const {
    review
  } = t0;
  let t1;
  if ($[0] !== review.rating) {
    t1 = "★".repeat(review.rating);
    $[0] = review.rating;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== review.text || $[3] !== t1) {
    t2 = <li>{t1} {review.text}</li>;
    $[2] = review.text;
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}
