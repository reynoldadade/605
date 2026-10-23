"use client";

import { c as _c } from "react/compiler-runtime";
export function RatingChart(t0) {
  const $ = _c(4);
  const {
    points
  } = t0;
  let t1;
  if ($[0] !== points) {
    t1 = points.map(_temp);
    $[0] = points;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = <ol>{t1}</ol>;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
function _temp(p, i) {
  return <li key={i}>{p}</li>;
}
