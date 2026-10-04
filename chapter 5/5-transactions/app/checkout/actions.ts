"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { verifySession } from "@/lib/dal";
import { payments, PaymentTimeoutError } from "@/lib/payments";
import { reserveOrder, confirmOrder, releaseOrder, findOrderByKey, CheckoutError } from "@/lib/orders";

export type CheckoutState = { status: "idle" | "error"; message?: string };

export async function placeOrder(attemptKey: string, prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await verifySession();
  if (!user) return { status: "error", message: "Please sign in to check out." };

  const existing = await findOrderByKey(user.userId, attemptKey);
  if (existing) redirect(`/orders/${existing.id}`);

  // Step 1: reserve stock and create a pending order, in one database transaction
  let order;
  try {
    order = await reserveOrder(user.userId, attemptKey);
  } catch (err) {
    if (err instanceof CheckoutError) return { status: "error", message: err.message };
    throw err;
  }

  // Step 2: charge, outside any transaction
  let charge;
  try {
    charge = await payments.charge({
      amount: order.total,
      customerId: user.userId,
      idempotencyKey: order.id,
      webhookOrigin: `http://${(await headers()).get("host")}`, // demo provider only
    });
  } catch (err) {
    // The unknown outcome: don't release, don't confirm. The order stays
    // pending and the provider's webhook settles it.
    if (err instanceof PaymentTimeoutError) redirect(`/orders/${order.id}`);
    throw err;
  }

  if (charge.status === "declined") {
    await releaseOrder(order.id); // compensate step 1
    return { status: "error", message: "Your payment was declined. You have not been charged." };
  }

  // Step 3: mark paid, clear the cart, queue the confirmation email, in one transaction
  await confirmOrder(order.id, charge.id);
  updateTag(`cart:${user.userId}`);

  redirect(`/orders/${order.id}`);
}
