import type { ReactNode } from "react";
import type { Product } from "@/lib/catalog";

// Server Component: no component code reaches the browser for the card.
export function ProductCard({ product, children }: { product: Product; children: ReactNode }) {
  return (
    <div className="card">
      <h3>{product.name}</h3>
      <p>{product.category} · ${product.price}</p>
      {children}
    </div>
  );
}
