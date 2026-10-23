import { products } from "@/lib/products";
import { ProductGrid } from "./ProductGrid";

export default function Page() {
  return <ProductGrid products={products} />;
}
