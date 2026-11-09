import { getProduct, products } from "@/lib/catalog";
import { LazyProductHero } from "@/components/ProductHero";
import { Details } from "@/components/Details";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/lazy/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <LazyProductHero product={product} />
      <Details product={product} />
    </main>
  );
}
