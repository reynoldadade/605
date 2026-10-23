"use client";

import type { Product } from "@/lib/products";

export function PriceSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label>
      Max price {value}
      <input type="range" min={0} max={200} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return <div className="card">{product.name} <b>${product.price}</b></div>;
}
