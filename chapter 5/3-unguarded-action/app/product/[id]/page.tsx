import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import ReviewList from "../../ReviewList";
import ReviewForm from "./ReviewForm";
import { deleteReview, submitReview } from "./actions";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <p className="muted">Guarded: section 6&apos;s actions</p>
      <Suspense fallback={<p>Loading...</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, verifySession()]);
  return (
    <>
      <p>Signed in as: {user?.userId ?? "nobody"}</p>
      <ReviewForm action={submitReview.bind(null, id)} />
      <ReviewList productId={id} user={user} deleteAction={deleteReview} />
    </>
  );
}
