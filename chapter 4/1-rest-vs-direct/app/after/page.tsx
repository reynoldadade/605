import { getProduct } from "@/lib/products";

export default async function AfterPage() {
  const product = await getProduct("1");

  if (!product) return <p>Not found</p>;

  return (
    <article>
      <h1>{product.name} (after)</h1>
      <p>{product.description}</p>
      <p>
        ${product.price} — {product.stock} in stock
      </p>
      <p style={{ color: "#888" }}>
        Fetched directly inside this Server Component. No route, no
        client-side request, no loading state.
      </p>
    </article>
  );
}
