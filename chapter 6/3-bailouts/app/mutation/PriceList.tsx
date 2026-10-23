"use client";

export type Item = { id: string; name: string; price: number };

// Breaks the immutability rule through a method call: sort() reorders the
// parent's array in place. Neither the compiler nor the lint rules flag it.
export function PriceList({ items }: { items: Item[] }) {
  items.sort((a, b) => a.price - b.price);
  return (
    <ul id="price-list">
      {items.map((i) => <li key={i.id}>{i.name}: ${i.price}</li>)}
    </ul>
  );
}
