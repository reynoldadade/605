"use client";

import { useReducer, useState } from "react";
import { PriceList, type Item } from "./PriceList";

// Legacy-style code that "worked" before the compiler: the basket keeps one
// array, changes it in place, and forces a re-render with a counter.
export function Basket() {
  const [items] = useState<Item[]>(() => [
    { id: "a", name: "Trail shoe", price: 129 },
    { id: "b", name: "Running socks", price: 19 },
  ]);
  const [version, bump] = useReducer((v: number) => v + 1, 0);

  function addItem() {
    items.push({ id: `x${version}`, name: `Extra item ${version + 1}`, price: 5 + version });
    bump();
  }

  return (
    <section>
      <button onClick={addItem}>Add item</button>
      <p id="count">{items.length} items</p>
      <PriceList items={items} />
    </section>
  );
}
