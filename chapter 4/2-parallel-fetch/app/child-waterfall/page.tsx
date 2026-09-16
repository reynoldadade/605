export const dynamic = "force-dynamic";

import { getProduct } from "@/lib/mock-data";
import Reviews from "./Reviews";

export default async function ChildWaterfallPage() {
  const start = Date.now();
  const product = await getProduct("1");
  const productElapsed = Date.now() - start;

  return (
    <article>
      <h1>{product.name} (child-waterfall)</h1>
      <p style={{ color: "#888" }}>
        Parent's own await finished at {productElapsed}ms — but Reviews
        below doesn't even start fetching until this function returns,
        so the page's real total is close to 300 + 500 = 800ms, not
        max(300, 500) = 500ms.
      </p>
      <Reviews productId="1" />
    </article>
  );
}
