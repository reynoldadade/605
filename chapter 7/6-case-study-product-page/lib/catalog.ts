import { connection } from "next/server";

export type Product = { id: string; name: string; price: number; currency: string; reviewCount: number };

export const products: Product[] = [
  { id: "alpine-shell", name: "Alpine Shell Jacket", price: 1299, currency: "USD", reviewCount: 84 },
  { id: "expedition-tent", name: "Expedition Tent", price: 2450, currency: "USD", reviewCount: 612 },
];

export function getProduct(id: string): Product {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`no product ${id}`);
  return p;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The pricing service: request-time, about 600 ms.
export async function getRegionalPrice(id: string) {
  await connection();
  await sleep(600);
  return getProduct(id).price;
}

// The reviews service times out for products with more than 500 reviews.
export async function getReviews(id: string) {
  await connection();
  await sleep(250);
  const p = getProduct(id);
  if (p.reviewCount > 500) throw new Error("reviews service timed out after 250 ms");
  return [
    { id: "r1", text: "Kept me dry through a full day of rain.", rating: 5 },
    { id: "r2", text: "Runs a little large.", rating: 4 },
  ];
}
