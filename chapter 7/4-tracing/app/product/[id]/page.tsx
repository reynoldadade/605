import { Suspense } from "react";
import { connection } from "next/server";
import { getProduct } from "@/lib/data/products";
import { getReviews } from "@/lib/data/reviews";
import { getRecommendations } from "@/lib/data/recommendations";
import { WishlistButton } from "./WishlistButton";

async function Product({ id }: { id: string }) {
  const product = await getProduct(id);
  return (
    <section>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <WishlistButton productId={id} />
    </section>
  );
}

async function Reviews({ id }: { id: string }) {
  await connection();
  const reviews = await getReviews(id);
  return <ul>{reviews.map((r) => <li key={r.id}>{r.text} {r.rating}/5</li>)}</ul>;
}

async function Recommendations({ id }: { id: string }) {
  await connection();
  const recs = await getRecommendations(id);
  return <p>Also bought: {recs.join(", ")}</p>;
}

export function generateStaticParams() {
  return [{ id: "trail-sock" }, { id: "big" }];
}

export default async function Page({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  return (
    <main>
      <Suspense fallback={<p>Loading product…</p>}>
        <Product id={id} />
      </Suspense>
      <Suspense fallback={<p>Loading reviews…</p>}>
        <Reviews id={id} />
      </Suspense>
      <Suspense fallback={<p>Loading recommendations…</p>}>
        <Recommendations id={id} />
      </Suspense>
    </main>
  );
}
