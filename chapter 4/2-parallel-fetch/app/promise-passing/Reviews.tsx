export default async function Reviews({
  reviewsPromise,
}: {
  reviewsPromise: Promise<{ id: string; text: string }[]>;
}) {
  const reviews = await reviewsPromise;
  return <p>{reviews.length} reviews</p>;
}
