import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Parallel Data Fetching</h1>
      <ul>
        <li><Link href="/sequential">/sequential</Link> — two awaits, one after another (~800ms)</li>
        <li><Link href="/parallel">/parallel</Link> — Promise.all (~500ms)</li>
        <li><Link href="/child-waterfall">/child-waterfall</Link> — implicit waterfall via nested Server Components (~800ms)</li>
        <li><Link href="/promise-passing">/promise-passing</Link> — the fix: fire early, pass the promise down (~500ms)</li>
      </ul>
    </main>
  );
}
