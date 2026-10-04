import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";

export class CheckoutError extends Error {}

export async function findOrderByKey(userId: string, idempotencyKey: string) {
  return db.order.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    select: { id: true, status: true, total: true },
  });
}

// Step 1: reserve stock and create a pending order, in one transaction.
// The total comes from prices in the database, never from the form.
export async function reserveOrder(userId: string, idempotencyKey: string) {
  try {
    return await db.$transaction(async (tx) => {
      const cart = await tx.cartItem.findMany({
        where: { userId },
        select: { productId: true, quantity: true, product: { select: { name: true, price: true } } },
      });
      if (cart.length === 0) throw new CheckoutError("Your cart is empty.");

      for (const item of cart) {
        // Conditional decrement: the check and the write are one statement.
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) throw new CheckoutError(`${item.product.name} is out of stock.`);
      }

      return tx.order.create({
        data: {
          userId,
          idempotencyKey,
          status: "pending",
          total: cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          items: {
            create: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.product.price })),
          },
        },
        select: { id: true, status: true, total: true },
      });
    });
  } catch (err) {
    // A concurrent duplicate with the same key lost the race on the
    // unique constraint. Its whole transaction (stock included) rolled
    // back; hand back the order the winner created.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await findOrderByKey(userId, idempotencyKey);
      if (existing) return existing;
    }
    throw err;
  }
}

// Step 3: mark paid, clear the cart, and record the email in the outbox,
// all in one transaction. Only a pending order can be confirmed, so a
// webhook and an action racing to confirm the same order are both safe.
export async function confirmOrder(orderId: string, chargeId: string) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "pending" },
      data: { status: "paid", chargeId },
    });
    if (count === 0) return false;

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { userId: true } });
    await tx.cartItem.deleteMany({ where: { userId: order.userId } });
    await tx.outbox.create({
      data: { type: "order-confirmation-email", payload: JSON.stringify({ orderId }) },
    });
    return true;
  });
}

// Compensation for step 1: return the reserved stock, cancel the order.
export async function releaseOrder(orderId: string) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "pending" },
      data: { status: "cancelled" },
    });
    if (count === 0) return;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}
