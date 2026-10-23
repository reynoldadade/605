"use client";

import { generateProducts, matches, type Product } from "@/lib/products";

const products = generateProducts();

export function Results({ query, limit }: { query: string; limit?: number }) {
  const found = products.filter((p) => matches(p, query));
  const shown = limit ? found.slice(0, limit) : found;
  return (
    <>
      <p>{limit ? `Showing ${shown.length} of ${found.length} products` : `${found.length} products`}</p>
      <div className="results">
        {shown.map((p) => <Result key={p.id} product={p} />)}
      </div>
    </>
  );
}

function Result({ product }: { product: Product }) {
  return (
    <div className="result">
      <strong>{product.name}</strong>
      <span> {product.category}</span>
      <span> ${product.price}</span>
    </div>
  );
}
