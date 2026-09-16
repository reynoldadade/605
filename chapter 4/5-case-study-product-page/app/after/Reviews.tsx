export default async function Reviews({
  promise,
}: {
  promise: Promise<string[]>;
}) {
  const reviews = await promise;
  return <ul>{reviews.map((r) => <li key={r}>{r}</li>)}</ul>;
}
