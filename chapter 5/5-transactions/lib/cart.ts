import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

export async function getCart(userId: string) {
  "use cache";
  cacheTag(`cart:${userId}`);
  cacheLife("hours");

  const items = await db.cartItem.findMany({
    where: { userId },
    select: { productId: true, quantity: true, product: { select: { name: true, price: true } } },
  });
  return items.map((i) => ({ productId: i.productId, quantity: i.quantity, name: i.product.name, price: i.product.price }));
}
