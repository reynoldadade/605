export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "trail-sock",
    name: "Trail Sock",
    price: 18,
    imageUrl: "/products/trail-sock.jpg",
    description: "A cushioned merino sock for long days on rough ground.",
  },
];

export function getProduct(id: string): Product {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`no product ${id}`);
  return p;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
