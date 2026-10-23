"use client";

import { useEffect, useEffectEvent } from "react";
import { inventory, notify } from "@/lib/inventory";

// The effect event always sees the latest muted, and isn't a dependency,
// so the subscription opens once per product.
export function StockWatcher({ productId, muted }: { productId: string; muted: boolean }) {
  const onStockChange = useEffectEvent((stock: number) => {
    if (stock < 5) notify(`Only ${stock} left`, { muted });
  });

  useEffect(() => {
    const unsubscribe = inventory.subscribe(productId, onStockChange);
    return unsubscribe;
  }, [productId]);

  return null;
}
