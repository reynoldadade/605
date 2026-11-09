import Link from "next/link";

export default function Home() {
  return (
    <ul style={{ padding: "1rem" }}>
      <li><Link href="/product/alpine-shell">Price formatted with the default locale</Link></li>
      <li><Link href="/fixed/alpine-shell">Price formatted with the server-chosen locale</Link></li>
    </ul>
  );
}
