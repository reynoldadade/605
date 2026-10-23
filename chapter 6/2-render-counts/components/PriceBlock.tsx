"use client";

const format = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PriceBlock({ price }: { price: number }) {
  return <p className="price">{format.format(price / 100)}</p>;
}
