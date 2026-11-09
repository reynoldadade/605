import { Suspense } from "react";
import { getProduct, getRegionalPrice, products, type Product } from "@/lib/catalog";
import { ProductHero } from "@/components/ProductHero";
import { PriceTag } from "@/components/PriceTag";
import { SizePicker } from "@/components/SizePicker";
import { Reviews } from "@/components/Reviews";
import { SectionBoundary } from "@/components/SectionBoundary";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

// The hero was combined with the regional price, so the photo waits for
// the pricing service.
async function ProductHeroWithPrice({ product }: { product: Product }) {
  const price = await getRegionalPrice(product.id);
  return (
    <>
      <ProductHero product={product} />
      <section>
        <h1>{product.name}</h1>
        <PriceTag price={price} currency={product.currency} />
      </section>
    </>
  );
}

export default async function Page({ params }: PageProps<"/before/product/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <Suspense fallback={<p>Loading product…</p>}>
        <ProductHeroWithPrice product={product} />
      </Suspense>
      <section>
        <SizePicker />
        <SectionBoundary>
          <Suspense fallback={<p>Loading reviews…</p>}>
            <Reviews id={product.id} />
          </Suspense>
        </SectionBoundary>
      </section>
    </main>
  );
}
