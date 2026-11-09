import { getReviews } from "@/lib/catalog";

export async function Reviews({ id }: { id: string }) {
  const reviews = await getReviews(id);
  return <ul className="reviews">{reviews.map((r) => <li key={r.id}>{r.text} {r.rating}/5</li>)}</ul>;
}
