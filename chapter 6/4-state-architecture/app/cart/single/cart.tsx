"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Line = { productId: string; qty: number };
type Cart = {
  items: Line[];
  addItem: (productId: string) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<Cart | null>(null);
const useCart = () => useContext(CartContext)!;

// Before: one context holds everything, so every change reaches every
// consumer: the badge, the toggle, the drawer, and all 24 buttons.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Line[]>([]);
  const [isOpen, setOpen] = useState(false);

  function addItem(productId: string) {
    setItems((prev) => {
      const line = prev.find((l) => l.productId === productId);
      return line
        ? prev.map((l) => (l === line ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { productId, qty: 1 }];
    });
  }

  const value = { items, addItem, isOpen, setOpen };
  return <CartContext value={value}>{children}</CartContext>;
}

export function CartCount() {
  const { items } = useCart();
  return <span className="badge">{items.length} in cart</span>;
}

export function DrawerToggle() {
  const { isOpen, setOpen } = useCart();
  return <button onClick={() => setOpen(!isOpen)}>{isOpen ? "Close cart" : "Open cart"}</button>;
}

export function CartDrawer() {
  const { items, isOpen } = useCart();
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
  const { addItem } = useCart();
  return <button onClick={() => addItem(productId)}>Add to cart</button>;
}
