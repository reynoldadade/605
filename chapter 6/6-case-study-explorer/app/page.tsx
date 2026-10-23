import Link from "next/link";

export default function Home() {
  return (
    <ul>
      <li><Link href="/before/catalogue">Before: the explorer as it grew</Link></li>
      <li><Link href="/after/catalogue">After: structure first, memoize last</Link></li>
    </ul>
  );
}
