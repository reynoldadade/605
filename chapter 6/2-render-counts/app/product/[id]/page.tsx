import { notFound } from "next/navigation";
import { getProduct, products, reviews } from "@/lib/catalog";
import { ProductIsland } from "@/components/ProductIsland";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

// Server Component: renders once, on the server. Only ProductIsland and what
// it renders run in the browser.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <main>
      <h1>{product.name}</h1>
      <ProductIsland product={product} reviews={reviews} />
    </main>
  );
}
