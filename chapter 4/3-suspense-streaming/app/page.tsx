import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Suspense Boundaries and Progressive Rendering</h1>
      <ul>
        <li><Link href="/no-suspense">/no-suspense</Link> — whole page waits for the slowest fetch (~1200ms)</li>
        <li><Link href="/with-suspense">/with-suspense</Link> — shell paints fast, one boundary around Reviews</li>
        <li><Link href="/progressive">/progressive</Link> — two independent boundaries, three painting stages</li>
      </ul>
    </main>
  );
}
