import { Suspense } from "react";
import { SALE_ENDS_AT } from "@/lib/catalog";
import { parseFilters } from "@/lib/filters";
import { getProductPage } from "@/lib/products";
import { CartBadge, AddToCart } from "./cart";
import { CompareToggle, CompareTray } from "./compare";
import { FilterBar } from "./FilterBar";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { SaleCountdown } from "./SaleCountdown";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// After: a Server Component again. Filters come from the URL, the server
// does the filtering, and only small islands run in the browser.
export default function Page({ searchParams }: PageProps) {
  return (
    <>
      <header>
        <h1>Catalogue</h1>
        <SaleCountdown endsAt={SALE_ENDS_AT} />
        <CartBadge />
      </header>
      <CompareTray />
      <Suspense fallback={<p>Loading products...</p>}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalogue({ searchParams }: PageProps) {
  const filters = parseFilters(await searchParams);
  const { products, total, pageCount } = await getProductPage(filters);

  return (
    <>
      <FilterBar initial={filters} />
      <p>{total} products</p>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p}>
            <CompareToggle productId={p.id} />
            <AddToCart productId={p.id} />
          </ProductCard>
        ))}
      </div>
      <Pagination filters={filters} pageCount={pageCount} />
    </>
  );
}
