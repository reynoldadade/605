import { Disclosure } from "./Disclosure";
import { SpecTable } from "./SpecTable";

export function generateStaticParams() {
  return [{ id: "p1" }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1>Product {id}</h1>
      <Disclosure title="Specifications">
        <SpecTable productId={id} />
      </Disclosure>
    </main>
  );
}
