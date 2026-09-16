import { getReviews } from "@/lib/mock-data";

export default async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
  return <ul>{reviews.map((r) => <li key={r}>{r}</li>)}</ul>;
}
