import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>3: Unguarded vs. guarded actions</h1>
      <ul>
        <li><Link href="/login">Sign in as a demo user</Link></li>
        <li><Link href="/unguarded/p1">Unguarded: section 2&apos;s deleteReview</Link></li>
        <li><Link href="/product/p1">Guarded: section 6&apos;s deleteReview and submitReview</Link></li>
        <li><Link href="/account">/account (behind proxy.ts)</Link></li>
      </ul>
      <p>Then run <code>npm run attack</code> to call the actions directly, without the UI.</p>
    </main>
  );
}
