import Link from "next/link";

export default function Home() {
  return (
    <ul style={{ padding: "1rem" }}>
      <li><Link href="/product/trail-sock">Hero in the shell, eager</Link></li>
      <li><Link href="/lazy/trail-sock">Hero in the shell, lazy</Link></li>
      <li><Link href="/suspended/trail-sock">Hero behind an 800 ms boundary</Link></li>
    </ul>
  );
}
