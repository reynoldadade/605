import { products } from "@/lib/products";
import { ProductCard } from "../ProductCard";
import { CartProvider, CartCount, DrawerToggle, CartDrawer, AddToCart } from "./cart";

export default function Page() {
  return (
    <CartProvider>
      <header>
        <h1>Shop</h1>
        <CartCount />
        <DrawerToggle />
      </header>
      <CartDrawer />
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p}>
            <AddToCart productId={p.id} />
          </ProductCard>
        ))}
      </div>
    </CartProvider>
  );
}
