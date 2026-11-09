import { Suspense } from "react";
import { connection } from "next/server";
import { getProduct, products, sleep, type Product } from "@/lib/catalog";
import { ProductHero } from "@/components/ProductHero";
import { Details } from "@/components/Details";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

// The hero waits for something request-time (a regional price, say)
// before it can render, so the photo is discovered late.
async function SlowHero({ product }: { product: Product }) {
  await connection();
  await sleep(800);
  return <ProductHero product={product} />;
}

export default async function Page({ params }: PageProps<"/suspended/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <Suspense fallback={<div className="skeleton" />}>
        <SlowHero product={product} />
      </Suspense>
      <Details product={product} />
    </main>
  );
}
