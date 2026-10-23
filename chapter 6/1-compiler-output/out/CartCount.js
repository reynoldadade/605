"use client";

import { c as _c } from "react/compiler-runtime";
import { createContext, useContext } from "react";
import { Badge } from "./Badge";
export const CartContext = createContext({
  items: []
});

// Section 4: a context reader. It re-runs when the context changes, but
// the <Badge> element is cached on items.length.
export function CartCount() {
  const $ = _c(2);
  const {
    items
  } = useContext(CartContext);
  let t0;
  if ($[0] !== items.length) {
    t0 = <Badge count={items.length} />;
    $[0] = items.length;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}
