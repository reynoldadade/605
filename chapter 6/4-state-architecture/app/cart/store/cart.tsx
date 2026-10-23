"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { createCartStore, type CartState, type CartStore } from "./store";

// The context carries the store itself, which never changes. Components
// subscribe to exactly the slice they read.
const StoreContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);
  return <StoreContext value={store}>{children}</StoreContext>;
}

function useCart<T>(selector: (s: CartState) => T): T {
  const store = useContext(StoreContext)!;
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

const useActions = () => useContext(StoreContext)!.actions;

export function CartCount() {
  const count = useCart((s) => s.items.length);
  return <span className="badge">{count} in cart</span>;
}

export function DrawerToggle() {
  const isOpen = useCart((s) => s.isOpen);
  const { toggleDrawer } = useActions();
  return <button onClick={toggleDrawer}>{isOpen ? "Close cart" : "Open cart"}</button>;
}

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const items = useCart((s) => s.items);
  if (!isOpen) return null;
  return (
    <aside>
      {items.length === 0 ? "Your cart is empty" : items.map((l) => (
        <p key={l.productId}>{l.productId} × {l.qty}</p>
      ))}
    </aside>
  );
}

export function AddToCart({ productId }: { productId: string }) {
  const { addItem } = useActions();
  return <button onClick={() => addItem(productId)}>Add to cart</button>;
}
