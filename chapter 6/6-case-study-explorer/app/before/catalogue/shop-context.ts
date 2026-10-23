"use client";

import { createContext } from "react";
import type { Product } from "@/lib/catalog";

type Shop = {
  products: Product[];
  compare: string[];
  toggleCompare: (id: string) => void;
  cart: string[];
  addToCart: (id: string) => void;
};

export const ShopContext = createContext<Shop | null>(null);
