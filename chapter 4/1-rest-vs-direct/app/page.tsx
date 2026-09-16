import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>REST route vs. direct Server Component access</h1>
      <p>
        <Link href="/before">/before</Link> — Client Component fetching
        from an internal REST route.
      </p>
      <p>
        <Link href="/after">/after</Link> — Server Component calling the
        data layer directly, no route in between.
      </p>
    </main>
  );
}
