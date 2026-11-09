import Image from "next/image";
import type { Product } from "@/lib/catalog";

export function ProductHero({ product }: { product: Product }) {
  return (
    <div className="hero">
      <Image src={`/products/${product.id}.jpg`} alt={product.name}
        width={800} height={800} loading="eager" fetchPriority="high"
        sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
  );
}
