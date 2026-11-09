import { Suspense } from "react";
import { headers } from "next/headers";
import { getProduct, getRegionalPrice, products, type Product } from "@/lib/catalog";
import { ProductHero } from "@/components/ProductHero";
import { LocalizedPriceTag } from "@/components/PriceTag";
import { SizePicker } from "@/components/SizePicker";
import { Reviews } from "@/components/Reviews";
import { SectionBoundary } from "@/components/SectionBoundary";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

const LOCALES = ["en-US", "de-DE", "fr-FR"];

// Only the price waits for the pricing service. The server resolves the
// reader's locale, so server and browser format the same string.
async function RegionalPrice({ product }: { product: Product }) {
  const [price, h] = await Promise.all([getRegionalPrice(product.id), headers()]);
  const wanted = h.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim();
  const locale = LOCALES.find((l) => l === wanted) ?? "en-US";
  return <LocalizedPriceTag price={price} currency={product.currency} locale={locale} />;
}

function PriceSkeleton() {
  return <span className="price">&nbsp;</span>;
}

export default async function Page({ params }: PageProps<"/after/product/[id]">) {
  const product = getProduct((await params).id);
  return (
    <main>
      <ProductHero product={product} />
      <section>
        <h1>{product.name}</h1>
        <Suspense fallback={<PriceSkeleton />}>
          <RegionalPrice product={product} />
        </Suspense>
        <SizePicker />
        <SectionBoundary report>
          <Suspense fallback={<p>Loading reviews…</p>}>
            <Reviews id={product.id} />
          </Suspense>
        </SectionBoundary>
      </section>
    </main>
  );
}
