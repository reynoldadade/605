// 5,000 deterministic products, generated the same way on server and client.
export type Product = { id: string; name: string; category: string; price: number };

const adjectives = ["Trail", "Road", "Light", "Waterproof", "Merino", "Insulated", "Packable", "Classic"];
const nouns = ["Running Shoe", "Sock", "Jacket", "Cap", "Vest", "Tights", "Glove", "Backpack", "Bottle", "Headlamp"];
const categories = ["Footwear", "Apparel", "Accessories", "Equipment"];

export function generateProducts(n = 5000): Product[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `${adjectives[i % adjectives.length]} ${nouns[(i * 7) % nouns.length]} ${i + 1}`,
    category: categories[i % categories.length],
    price: 5 + ((i * 37) % 300),
  }));
}

export function matches(p: Product, query: string) {
  const q = query.trim().toLowerCase();
  return q === "" || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
}
