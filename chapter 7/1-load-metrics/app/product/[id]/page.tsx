import { getProduct, products } from "@/lib/catalog";
import { ProductHero } from "@/components/ProductHero";
import { Details } from "@/components/Details";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/product/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <ProductHero product={product} />
      {/* name, price, and reviews (in their own <Suspense>) */}
      <Details product={product} />
    </main>
  );
}
