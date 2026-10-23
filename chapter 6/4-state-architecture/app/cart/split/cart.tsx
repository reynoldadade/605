"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Line = { productId: string; qty: number };
type Actions = { addItem: (productId: string) => void; toggleDrawer: () => void };

// After: split by how often each part changes. Actions never change, so a
// component that only reads actions never re-renders because of the cart.
const CartActionsContext = createContext<Actions | null>(null);
const CartItemsContext = createContext<Line[]>([]);
const CartDrawerContext = createContext(false);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Line[]>([]);
  const [isOpen, setOpen] = useState(false);

  // Only stable setters inside, so the compiler creates this object once.
  const actions: Actions = {
    addItem(productId) {
      setItems((prev) => {
        const line = prev.find((l) => l.productId === productId);
        return line
          ? prev.map((l) => (l === line ? { ...l, qty: l.qty + 1 } : l))
          : [...prev, { productId, qty: 1 }];
      });
    },
    toggleDrawer() {
      setOpen((o) => !o);
    },
  };

  return (
    <CartActionsContext value={actions}>
      <CartItemsContext value={items}>
        <CartDrawerContext value={isOpen}>{children}</CartDrawerContext>
      </CartItemsContext>
    </CartActionsContext>
  );
}

const useActions = () => useContext(CartActionsContext)!;

export function CartCount() {
  const items = useContext(CartItemsContext);
  return <span className="badge">{items.length} in cart</span>;
}

export function DrawerToggle() {
  const isOpen = useContext(CartDrawerContext);
  const { toggleDrawer } = useActions();
  return <button onClick={toggleDrawer}>{isOpen ? "Close cart" : "Open cart"}</button>;
}

export function CartDrawer() {
  const isOpen = useContext(CartDrawerContext);
  const items = useContext(CartItemsContext);
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
