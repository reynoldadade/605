export default async function Recommendations({
  promise,
}: {
  promise: Promise<string[]>;
}) {
  const recommendations = await promise;
  return <ul>{recommendations.map((r) => <li key={r}>{r}</li>)}</ul>;
}
