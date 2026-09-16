// A stand-in for a real database client (e.g. Prisma). The artificial
// delay is here so the difference between the "before" and "after"
// pages is visible on localhost rather than too fast to notice.
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

const PRODUCTS: Record<string, Product> = {
  "1": {
    id: "1",
    name: "Mechanical Keyboard",
    description: "A tactile, hot-swappable 65% keyboard.",
    price: 129,
    stock: 14,
  },
};

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const db = {
  product: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return delay(PRODUCTS[where.id] ?? null, 300);
    },
  },
};
