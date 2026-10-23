import Link from "next/link";

export default function Home() {
  return (
    <ul>
      <li><Link href="/product/p1">Draft held by the island&apos;s top component</Link></li>
      <li><Link href="/moved/p1">Draft held by the composer (section 6)</Link></li>
    </ul>
  );
}
