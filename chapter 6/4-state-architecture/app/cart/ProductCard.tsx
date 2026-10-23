import type { ReactNode } from "react";
import type { Product } from "@/lib/products";

// Server Component: rendered once on the server. The client island inside
// it (AddToCart) arrives as children.
export function ProductCard({ product, children }: { product: Product; children: ReactNode }) {
  return (
    <div className="card">
      {product.name} <b>${product.price}</b>
      {children}
    </div>
  );
}
