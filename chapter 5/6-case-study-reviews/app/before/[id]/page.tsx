import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import { getProduct, getReviews } from "@/lib/reviews";
import { getRecommendations } from "@/lib/recommendations";
import { postReview } from "./actions";

export default function BeforePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <p className="muted">Before</p>
      <Suspense fallback={<p>Loading product...</p>}>
        <Product params={params} />
      </Suspense>
    </main>
  );
}

async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifySession();
  const product = await getProduct(id);
  if (!product) return <p>Product not found.</p>;
  const reviewsPromise = getReviews(id);
  const recommendationsPromise = getRecommendations(id);

  return (
    <article>
      <h1>{product.name}</h1>
      <p data-testid="summary">Average {product.ratingAverage.toFixed(2)} from {product.ratingCount} reviews</p>

      <form action={postReview}>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="authorId" value={user?.userId ?? ""} />
        <select name="rating">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <textarea name="text" />
        <button type="submit">Post review</button>
      </form>

      <Suspense fallback={<p>Loading reviews...</p>}>
        <Reviews promise={reviewsPromise} />
      </Suspense>
      <Suspense fallback={<p>Loading recommendations...</p>}>
        <Recommendations promise={recommendationsPromise} />
      </Suspense>
    </article>
  );
}

async function Reviews({ promise }: { promise: ReturnType<typeof getReviews> }) {
  const reviews = await promise;
  return (
    <section>
      <h2>Reviews ({reviews.length})</h2>
      {reviews.map((r) => (
        <div key={r.id} className="review" data-testid="review">
          <p>{"★".repeat(r.rating)} {r.author?.name ?? "Anonymous"}</p>
          <p>{r.text}</p>
        </div>
      ))}
    </section>
  );
}

async function Recommendations({ promise }: { promise: ReturnType<typeof getRecommendations> }) {
  const recs = await promise;
  return (
    <section data-testid="recommendations">
      <h2>You might also like</h2>
      <ul>{recs.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </section>
  );
}
