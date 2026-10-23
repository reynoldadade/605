"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Split by rate of change: actions never change, items do.
const CartActions = createContext<{ addToCart: (id: string) => void } | null>(null);
const CartItems = createContext<string[]>([]);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const actions = { addToCart: (id: string) => setItems((c) => [...c, id]) };
  return (
    <CartActions value={actions}>
      <CartItems value={items}>{children}</CartItems>
    </CartActions>
  );
}

export function CartBadge() {
  const items = useContext(CartItems);
  return <span id="cart-badge">Cart: {items.length}</span>;
}

export function AddToCart({ productId }: { productId: string }) {
  const { addToCart } = useContext(CartActions)!;
  return <button onClick={() => addToCart(productId)}>Add to cart</button>;
}
