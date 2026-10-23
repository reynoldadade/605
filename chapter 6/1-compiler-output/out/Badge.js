"use client";

import { c as _c } from "react/compiler-runtime";
export function Badge(t0) {
  const $ = _c(2);
  const {
    count
  } = t0;
  let t1;
  if ($[0] !== count) {
    t1 = <span className="badge">{count}</span>;
    $[0] = count;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
