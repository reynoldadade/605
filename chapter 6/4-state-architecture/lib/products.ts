export type Product = { id: string; name: string; price: number };

export const products: Product[] = Array.from({ length: 24 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Product ${i + 1}`,
  price: 10 + ((i * 37) % 190),
}));
