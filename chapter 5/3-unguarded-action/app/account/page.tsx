import { Suspense } from "react";
import { verifySession } from "@/lib/dal";

export default function AccountPage() {
  return (
    <main>
      <h1>Your account</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Who />
      </Suspense>
    </main>
  );
}

async function Who() {
  // proxy.ts already redirected visitors with no cookie at all. This is
  // the real check: a forged or expired cookie gets past proxy, not past
  // verifySession.
  const user = await verifySession();
  return <p>{user ? `Signed in as ${user.userId}` : "Your session is invalid. Please sign in again."}</p>;
}
