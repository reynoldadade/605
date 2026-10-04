import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>1: API route vs. Server Action</h1>
      <p>The same review form, wired two ways.</p>
      <ul>
        <li><Link href="/api-version/p1">Before: client <code>fetch</code> to a Route Handler</Link></li>
        <li><Link href="/product/p1">After: a Server Action</Link></li>
      </ul>
    </main>
  );
}
