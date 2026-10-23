"use client";

import { useEffect } from "react";
import { inventory, notify } from "@/lib/inventory";

// muted is only read by the handler, but as a dependency it tears down
// and reopens the subscription every time the reader toggles sound.
export function StockWatcher({ productId, muted }: { productId: string; muted: boolean }) {
  useEffect(() => {
    const unsubscribe = inventory.subscribe(productId, (stock) => {
      if (stock < 5) notify(`Only ${stock} left`, { muted });
    });
    return unsubscribe;
  }, [productId, muted]);

  return null;
}
