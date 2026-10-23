"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { PriceSlider, ProductCard } from "../shared";

// After: calculated during render. One render per change, always
// consistent, and cached on products and maxPrice by the compiler.
export function ProductGrid({ products }: { products: Product[] }) {
  const [maxPrice, setMaxPrice] = useState(200);
  const filtered = products.filter((p) => p.price <= maxPrice);

  return (
    <>
      <PriceSlider value={maxPrice} onChange={setMaxPrice} />
      <div className="grid">
        {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}
