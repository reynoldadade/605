import Link from "next/link";
import { products } from "@/lib/catalog";

export default function Home() {
  return (
    <section style={{ padding: "1rem" }}>
      <h1>New this week</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}><Link href={`/product/${p.id}`}>{p.name}</Link></li>
        ))}
      </ul>
    </section>
  );
}
