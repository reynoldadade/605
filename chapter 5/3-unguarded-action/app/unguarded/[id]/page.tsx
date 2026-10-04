import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import ReviewList from "../../ReviewList";
import { deleteReview } from "./actions";

export default function UnguardedPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <p className="muted">Unguarded: section 2&apos;s deleteReview</p>
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
      <ReviewList productId={id} user={user} deleteAction={deleteReview} />
    </>
  );
}
