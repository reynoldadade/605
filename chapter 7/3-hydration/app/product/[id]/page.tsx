import { Suspense } from "react";
import Image from "next/image";
import { getProduct, products } from "@/lib/catalog";
import { PriceTag } from "@/components/PriceTag";
import { SizePicker } from "@/components/SizePicker";
import { Specs } from "@/components/Specs";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/product/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <div className="hero">
        <Image src={`/products/${product.id}.jpg`} alt={product.name}
          width={800} height={800} loading="eager" fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <section>
        <h1>{product.name}</h1>
        {/* the boundary React falls back to when this island mismatches */}
        <Suspense>
          <PriceTag price={product.price} currency={product.currency} />
          <SizePicker />
          <Specs />
        </Suspense>
      </section>
    </main>
  );
}
