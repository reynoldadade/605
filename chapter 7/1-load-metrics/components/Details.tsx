import { Suspense } from "react";
import { connection } from "next/server";
import { sleep, type Product } from "@/lib/catalog";

async function Reviews() {
  await connection();
  await sleep(300); // a request-time read, as in Chapter 4
  return (
    <ul className="reviews">
      <li>Warm without being bulky. 5/5</li>
      <li>Held up for a 40 km week. 4/5</li>
    </ul>
  );
}

export function Details({ product }: { product: Product }) {
  return (
    <section>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>From ${product.price}</p>
      <Suspense fallback={<p>Loading reviews…</p>}>
        <Reviews />
      </Suspense>
    </section>
  );
}
