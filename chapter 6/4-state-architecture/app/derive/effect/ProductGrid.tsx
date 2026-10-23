"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { PriceSlider, ProductCard } from "../shared";

// Before: the filtered list is a second piece of state, synchronized by an
// effect. Every change renders twice, and the first render is inconsistent.
export function ProductGrid({ products }: { products: Product[] }) {
  const [maxPrice, setMaxPrice] = useState(200);
  const [filtered, setFiltered] = useState<Product[]>(products);

  useEffect(() => {
    setFiltered(products.filter((p) => p.price <= maxPrice));
  }, [products, maxPrice]);

  return (
    <>
      <PriceSlider value={maxPrice} onChange={setMaxPrice} />
      <div className="grid">
        {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}
