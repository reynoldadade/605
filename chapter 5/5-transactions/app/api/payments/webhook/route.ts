import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { confirmOrder, releaseOrder } from "@/lib/orders";
import { WEBHOOK_SECRET } from "@/lib/payments";

// Settles orders whose charge outcome the action never heard. Real
// providers sign their webhooks; verify that signature before trusting
// anything in the body.
export async function POST(request: Request) {
  if (request.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  const { orderId, chargeId, status } = (await request.json()) as {
    orderId: string; chargeId: string; status: "approved" | "declined";
  };

  if (status === "approved") {
    const confirmed = await confirmOrder(orderId, chargeId);
    if (confirmed) {
      const order = await db.order.findUnique({ where: { id: orderId }, select: { userId: true } });
      // Not a user waiting on their own write: stale-while-revalidate is fine.
      if (order) revalidateTag(`cart:${order.userId}`, "max");
    }
  } else {
    await releaseOrder(orderId);
  }
  return Response.json({ ok: true });
}
