import { Suspense } from "react";
import { getProduct, getReviews } from "@/lib/reviews";
import { getRecommendations } from "@/lib/recommendations";
import ReviewComposer from "./ReviewComposer";
import SectionBoundary from "./SectionBoundary";
import { submitReview } from "./actions";

export async function generateStaticParams() {
  return [{ id: "p1" }, { id: "p2" }];
}

export default async function AfterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return <p>Product not found.</p>;

  return (
    <main>
      <p className="muted">After</p>
      <article>
        <h1>{product.name}</h1>
        <p data-testid="summary">Average {product.ratingAverage.toFixed(2)} from {product.ratingCount} reviews</p>

        <ReviewComposer action={submitReview.bind(null, product.id)} />

        <Suspense fallback={<p>Loading reviews...</p>}>
          <Reviews productId={product.id} />
        </Suspense>

        <SectionBoundary label="recommendations">
          <Suspense fallback={<p>Loading recommendations...</p>}>
            <Recommendations productId={product.id} />
          </Suspense>
        </SectionBoundary>
      </article>
    </main>
  );
}

async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
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

async function Recommendations({ productId }: { productId: string }) {
  const recs = await getRecommendations(productId);
  return (
    <section data-testid="recommendations">
      <h2>You might also like</h2>
      <ul>{recs.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
    </section>
  );
}
