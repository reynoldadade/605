"use server";

import { traced } from "@/lib/data/tracer";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function addToWishlist(productId: string) {
  return traced("addToWishlist", { "product.id": productId }, async () => {
    await sleep(40);
  });
}
