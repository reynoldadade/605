// 5,000 deterministic products. In earlier chapters this lived in a
// database; here a module stands in, so the examples run anywhere.
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
};

const adjectives = ["Trail", "Road", "Light", "Waterproof", "Merino", "Insulated", "Packable", "Classic"];
const nouns = ["Running Shoe", "Sock", "Jacket", "Cap", "Vest", "Tights", "Glove", "Backpack", "Bottle", "Headlamp"];
const categories = ["Footwear", "Apparel", "Accessories", "Equipment"];

export const allProducts: Product[] = Array.from({ length: 5000 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `${adjectives[i % adjectives.length]} ${nouns[(i * 7) % nouns.length]} ${i + 1}`,
  category: categories[i % categories.length],
  price: 5 + ((i * 37) % 300),
}));

// The site-wide sale ends at a fixed moment (here: a day after midnight UTC
// on the day the module loads, so the countdown is always running).
export const SALE_ENDS_AT = new Date(new Date().toISOString().slice(0, 10)).getTime() + 2 * 86_400_000;

export function matches(p: Product, query: string, maxPrice: number) {
  const q = query.trim().toLowerCase();
  return p.price <= maxPrice && (q === "" || p.name.toLowerCase().includes(q));
}
