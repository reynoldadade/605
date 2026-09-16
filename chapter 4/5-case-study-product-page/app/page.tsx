import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Case Study: Redesigning a Product Page's Data Strategy</h1>
      <ul>
        <li><Link href="/before">/before</Link> — sequential, uncached, no Suspense</li>
        <li><Link href="/after">/after</Link> — parallel, cached, streamed</li>
      </ul>
    </main>
  );
}
