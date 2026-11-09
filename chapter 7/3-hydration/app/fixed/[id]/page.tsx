import { Suspense } from "react";
import Image from "next/image";
import { headers } from "next/headers";
import { getProduct, products } from "@/lib/catalog";
import { FixedPriceTag } from "@/components/PriceTag";
import { SizePicker } from "@/components/SizePicker";
import { Specs } from "@/components/Specs";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

const SUPPORTED = ["en-US", "de-DE", "fr-FR"];

// The server picks the reader's locale and hands it to the island.
async function LocalizedPrice({ price, currency }: { price: number; currency: string }) {
  const accept = (await headers()).get("accept-language") ?? "";
  const wanted = accept.split(",")[0]?.split(";")[0]?.trim();
  const locale = SUPPORTED.find((l) => l === wanted) ?? "en-US";
  return <FixedPriceTag price={price} currency={currency} locale={locale} />;
}

export default async function Page({ params }: PageProps<"/fixed/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <div className="hero">
        <Image src={`/products/${product.id}.jpg`} alt={product.name}
          width={800} height={800} loading="eager" fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <section>
        <h1>{product.name}</h1>
        <Suspense fallback={<span className="price">&nbsp;</span>}>
          <LocalizedPrice price={product.price} currency={product.currency} />
        </Suspense>
        <Suspense>
          <SizePicker />
          <Specs />
        </Suspense>
      </section>
    </main>
  );
}
