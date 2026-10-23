"use client";

import { useContext } from "react";
import type { Product } from "@/lib/catalog";
import { ShopContext } from "./shop-context";

export function ProductCard({ product }: { product: Product }) {
  const { compare, toggleCompare, addToCart } = useContext(ShopContext)!;

  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{product.category} · ${product.price}</p>
      <label>
        <input
          type="checkbox"
          checked={compare.includes(product.id)}
          onChange={() => toggleCompare(product.id)}
        />{" "}
        Compare
      </label>
      <button onClick={() => addToCart(product.id)}>Add to cart</button>
    </div>
  );
}

