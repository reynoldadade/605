export const products = [
  { id: "alpine-shell", name: "Alpine Shell Jacket", price: 1299, currency: "USD" },
];

export function getProduct(id: string) {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`no product ${id}`);
  return p;
}
