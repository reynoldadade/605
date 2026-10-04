import { Suspense } from "react";
import { getProduct, getReviews } from "@/lib/reviews";
import ReviewComposer from "./ReviewComposer";
import { submitReview } from "./actions";
import { setDemoMode } from "./demo";

export async function generateStaticParams() {
  return [{ id: "p1" }, { id: "p2" }];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return <p>Product not found.</p>;

  return (
    <main>
      <h1>{product.name}</h1>

      <form action={setDemoMode} className="muted">
        Demo:{" "}
        <select name="mode" defaultValue="ok">
          <option value="ok">succeed</option>
          <option value="stale">succeed, but revalidateTag(&quot;reviews&quot;, &quot;max&quot;)</option>
          <option value="error">return an error</option>
          <option value="throw">throw</option>
        </select>
        <input name="delay" type="number" defaultValue={1500} /> ms
        <button type="submit">Set</button>
      </form>

      {/* Leaf Client Component: the reader's own in-flight reviews + the form */}
      <ReviewComposer action={submitReview.bind(null, id)} />

      {/* Every published review stays server-rendered */}
      <Suspense fallback={<p>Loading reviews...</p>}>
        <ReviewList productId={id} />
      </Suspense>
    </main>
  );
}

async function ReviewList({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
  return (
    <>
      <h2>Reviews ({reviews.length})</h2>
      {reviews.map((r) => (
        <article key={r.id} className="review" data-testid="review">
          <p>{"★".repeat(r.rating)}</p>
          <p>{r.text}</p>
        </article>
      ))}
    </>
  );
}
