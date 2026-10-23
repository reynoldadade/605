import type { ReactNode } from "react";
import { CartProvider } from "./catalogue/cart";
import { CompareProvider } from "./catalogue/compare";

export default function AfterLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CompareProvider>{children}</CompareProvider>
    </CartProvider>
  );
}
