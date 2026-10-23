// Static catalogue data for the example. The book's earlier chapters read
// this from a database; here the client-side rendering is the subject, so
// the data stays in a module.
export type Review = { id: string; author: string; rating: number; text: string };
export type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[];
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Trail Running Shoe",
    price: 12900,
    images: ["side", "top", "sole", "heel", "laces", "box"],
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
  },
];

const texts = [
  "Great grip on wet rock, and comfortable from the first run.",
  "Runs half a size small, so order up. Otherwise excellent.",
  "Light and breathable. The laces could be longer.",
  "Took a few runs to break in, now my favourite pair.",
];

export const reviews: Review[] = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i + 1}`,
  author: ["Alice", "Bob", "Chen", "Dana"][i % 4],
  rating: 3 + (i % 3),
  text: texts[i % texts.length],
}));

export function getProduct(id: string) {
  return products.find((p) => p.id === id) ?? null;
}
