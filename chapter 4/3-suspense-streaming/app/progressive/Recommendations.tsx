import { getRecommendations } from "@/lib/mock-data";

export default async function Recommendations({
  productId,
}: {
  productId: string;
}) {
  const recommendations = await getRecommendations(productId);
  return <ul>{recommendations.map((r) => <li key={r}>{r}</li>)}</ul>;
}
