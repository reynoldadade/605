import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

// Custom hooks are compiled too.
export function useToggle(t0) {
  const $ = _c(3);
  const initial = t0 === undefined ? false : t0;
  const [on, setOn] = useState(initial);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => setOn(_temp);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const toggle = t1;
  let t2;
  if ($[1] !== on) {
    t2 = {
      on,
      toggle
    };
    $[1] = on;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}
function _temp(v) {
  return !v;
}
