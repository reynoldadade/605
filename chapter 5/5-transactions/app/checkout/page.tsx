import { Suspense } from "react";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import CheckoutForm from "./CheckoutForm";
import { placeOrder } from "./actions";
import { verifySession } from "@/lib/dal";
import { getCart } from "@/lib/cart";

export default function CheckoutPage() {
  return (
    <main>
      <h1>Checkout</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Checkout />
      </Suspense>
    </main>
  );
}

async function Checkout() {
  // Next.js 16 (Cache Components): a random value has to come after
  // something request-specific, or prerendering would bake one key into
  // the static shell and every visitor would share it.
  await connection();
  const attemptKey = randomUUID();

  const user = await verifySession();
  if (!user) return <p>Please sign in to check out.</p>;
  const cart = await getCart(user.userId);

  return (
    <>
      <ul>
        {cart.map((i) => (
          <li key={i.productId}>{i.quantity} × {i.name}, ${(i.price / 100).toFixed(2)}</li>
        ))}
      </ul>
      <CheckoutForm action={placeOrder.bind(null, attemptKey)} />
    </>
  );
}
