import Image from "next/image";
import type { Product } from "@/lib/catalog";

// The LCP element, loaded immediately and ahead of other images.
export function ProductHero({ product }: { product: Product }) {
  return (
    <div className="hero">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={800}
        height={800}
        loading="eager"
        fetchPriority="high"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

// The same image with next/image's default: lazy, normal priority.
export function LazyProductHero({ product }: { product: Product }) {
  return (
    <div className="hero">
      <Image
        src={product.imageUrl}
        alt={product.name}
        width={800}
        height={800}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
