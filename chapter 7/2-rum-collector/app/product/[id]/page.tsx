import Image from "next/image";
import Link from "next/link";
import { getProduct, products } from "@/lib/catalog";
import { SizePicker } from "@/app/_components/SizePicker";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/product/[id]">) {
  const product = getProduct((await params).id);
  const other = products.find((p) => p.id !== product.id)!;
  return (
    <main>
      <div className="hero">
        <Image src={`/products/${product.id}.jpg`} alt={product.name}
          width={800} height={800} loading="eager" fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <section>
        <h1>{product.name}</h1>
        <p>${product.price}</p>
        <SizePicker />
        <p><Link href={`/product/${other.id}`}>See also: {other.name}</Link></p>
      </section>
    </main>
  );
}
