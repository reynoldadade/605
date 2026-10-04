import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <Suspense fallback={<p>Loading order...</p>}>
        <Order params={params} />
      </Suspense>
    </main>
  );
}

async function Order({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, verifySession()]);
  if (!user) notFound();
  // Scoped to the signed-in user, like section 6's deleteMany.
  const order = await db.order.findFirst({
    where: { id, userId: user.userId },
    select: { id: true, status: true, total: true },
  });
  if (!order) notFound();

  return (
    <>
      <h1>Order {order.id}</h1>
      <p data-testid="order-status">
        {order.status === "pending"
          ? "We're confirming your payment. This page will show the result shortly."
          : order.status === "paid"
            ? `Paid: $${(order.total / 100).toFixed(2)}. A confirmation email is on its way.`
            : "Cancelled. You have not been charged."}
      </p>
    </>
  );
}
