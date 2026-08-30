// app/page.tsx
//
// The Server Component that does the composing: it imports both
// Modal (client chrome) and ProductReviews (server content, real
// server-only I/O) and hands the second to the first through
// `children`. Modal and ProductReviews never import each other.
import { getProduct } from "../lib/mock-data";
import Modal from "./Modal";
import ProductReviews from "./ProductReviews";

export default async function Page() {
  const product = await getProduct("prod_1");

  return (
    <article>
      <h1>{product.name}</h1>
      <p>
        A Client Component (<code>Modal</code>) providing the open/close
        chrome, wrapped around a Server Component (
        <code>ProductReviews</code>) doing a real server-only data fetch.
        Open your browser&apos;s Network tab: nothing fires when you click
        the button below, because the reviews were already fetched and
        rendered on the server before this page was sent.
      </p>
      <Modal trigger="See reviews">
        <ProductReviews productId={product.id} />
      </Modal>
    </article>
  );
}
