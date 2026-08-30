// lib/mock-data.ts
//
// Stand-in for a real database/API, same shape as the other examples'
// mock-data.ts. The artificial delay is here to make a point: this
// query only ever runs on the server, whether or not the reader ever
// opens the modal that reveals its result.

export type Product = { id: string; name: string };
export type Review = { id: string; author: string; rating: number; body: string };

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getProduct(productId: string): Promise<Product> {
  return delay({ id: productId, name: "Field Recorder Mic, Model 4" });
}

export async function getReviews(productId: string): Promise<Review[]> {
  return delay([
    { id: "r1", author: "Priya N.", rating: 5, body: "Picked up room tone I didn't know was there. Worth it." },
    { id: "r2", author: "Leo F.", rating: 4, body: "Great for the price. Wind noise outdoors without a cover." },
    { id: "r3", author: "Sofia R.", rating: 5, body: "Replaced two older mics for me. Simple to set up." },
  ]);
}
