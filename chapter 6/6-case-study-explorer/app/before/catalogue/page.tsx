"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";
import { matches } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { SaleBanner } from "./SaleBanner";
import { ShopContext } from "./shop-context";

function sortProducts(list: Product[], sort: string) {
  // sorts in place: the products state array itself is reordered
  return sort === "price" ? list.sort((a, b) => a.price - b.price) : list;
}

// Before: the whole explorer is one Client Component. Every feature added
// its state here, and one context carries all of it to every card.
export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(300);
  const [sort, setSort] = useState("relevance");
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  useEffect(() => {
    setFiltered(sortProducts(products, sort).filter((p) => matches(p, query, maxPrice)));
  }, [products, query, maxPrice, sort]);

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const addToCart = (id: string) => setCart((c) => [...c, id]);

  if (products.length === 0) return <p>Loading catalogue...</p>;

  return (
    <ShopContext value={{ products, compare, toggleCompare, cart, addToCart }}>
      <header>
        <h1>Catalogue</h1>
        <SaleBanner />
        <span id="cart-badge">Cart: {cart.length}</span>
      </header>
      <div className="filters">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
        <label>
          Max price
          <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}>
            {[50, 100, 200, 300].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="price">Price</option>
        </select>
      </div>
      <div className="tray">Comparing: {compare.join(", ")}</div>
      <p>{filtered.length} products</p>
      <div className="grid">
        {filtered.map((p, i) => <ProductCard key={i} product={p} />)}
      </div>
    </ShopContext>
  );
}
