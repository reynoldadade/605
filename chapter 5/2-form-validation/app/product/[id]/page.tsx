import { getProduct, getReviews } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";
import { submitReview } from "./actions";

// Known product IDs are listed so the whole page, form included, is
// prerendered into the static shell. That is what lets the form work
// with JavaScript disabled entirely (see README).
export async function generateStaticParams() {
  return [{ id: "p1" }, { id: "p2" }];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([getProduct(id), getReviews(id)]);
  if (!product) return <p>Product not found.</p>;

  return (
    <main>
      <article>
        <h1>{product.name}</h1>
        <ReviewForm action={submitReview.bind(null, id)} />
        <h2>Reviews ({reviews.length})</h2>
        {reviews.map((r) => (
          <div key={r.id} className="review" data-testid="review">
            <p>{"★".repeat(r.rating)} {r.author?.name ?? "Anonymous"}</p>
            <p>{r.text}</p>
          </div>
        ))}
      </article>
    </main>
  );
}
