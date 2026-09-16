function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

type Product = { id: string; name: string; description: string; price: number; stock: number };

const PRODUCTS: Record<string, Product> = {
  "1": {
    id: "1",
    name: "Mechanical Keyboard",
    description: "A tactile, hot-swappable 65% keyboard.",
    price: 129,
    stock: 14,
  },
};

const REVIEWS: Record<string, string[]> = {
  "1": ["Great tactile feel.", "Louder than expected, still love it."],
};

const RECOMMENDATIONS: Record<string, string[]> = {
  "1": ["Keycap set", "Wrist rest", "USB-C cable"],
};

export const db = {
  product: {
    findUnique: async ({ where }: { where: { id: string } }) =>
      delay(PRODUCTS[where.id] ?? null, 300),
  },
  review: {
    findMany: async ({ where }: { where: { productId: string } }) =>
      delay(REVIEWS[where.productId] ?? [], 500),
  },
  recommendation: {
    findMany: async ({ where }: { where: { productId: string } }) =>
      delay(RECOMMENDATIONS[where.productId] ?? [], 1200),
  },
};
