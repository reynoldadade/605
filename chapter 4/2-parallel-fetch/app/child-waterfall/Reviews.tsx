import { getReviews } from "@/lib/mock-data";

export default async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);
  return <p>{reviews.length} reviews</p>;
}
