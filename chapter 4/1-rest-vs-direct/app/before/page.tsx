"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

export default function BeforePage() {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products/1")
      .then((r) => r.json())
      .then(setProduct);
  }, []);

  if (!product) return <p>Loading...</p>;

  return (
    <article>
      <h1>{product.name} (before)</h1>
      <p>{product.description}</p>
      <p>
        ${product.price} — {product.stock} in stock
      </p>
      <p style={{ color: "#888" }}>
        Fetched client-side from /api/products/1 after hydration.
      </p>
    </article>
  );
}
