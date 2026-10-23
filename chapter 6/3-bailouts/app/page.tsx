import Link from "next/link";

export default function Home() {
  return (
    <ul>
      <li><Link href="/purity">Impure render: Date.now() during render</Link></li>
      <li><Link href="/mutation">Mutation: sorting a prop in place</Link></li>
      <li><Link href="/refs">Reading a ref during render</Link></li>
    </ul>
  );
}
