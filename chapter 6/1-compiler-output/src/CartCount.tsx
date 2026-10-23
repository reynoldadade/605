"use client";

import { createContext, useContext } from "react";
import { Badge } from "./Badge";

export const CartContext = createContext<{ items: { id: string; qty: number }[] }>({ items: [] });

// Section 4: a context reader. It re-runs when the context changes, but
// the <Badge> element is cached on items.length.
export function CartCount() {
  const { items } = useContext(CartContext);
  return <Badge count={items.length} />;
}
