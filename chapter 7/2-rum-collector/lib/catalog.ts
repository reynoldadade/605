export const products = [
  { id: "trail-sock", name: "Trail Sock", price: 18 },
  { id: "summit-beanie", name: "Summit Beanie", price: 32 },
];

export function getProduct(id: string) {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`no product ${id}`);
  return p;
}
