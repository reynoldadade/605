"use client";

import { useTransition } from "react";
import { addToWishlist } from "./actions";

export function WishlistButton({ productId }: { productId: string }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => start(() => addToWishlist(productId))}>
      {pending ? "Saving…" : "Add to wishlist"}
    </button>
  );
}
