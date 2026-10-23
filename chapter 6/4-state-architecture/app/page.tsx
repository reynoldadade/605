import Link from "next/link";

export default function Home() {
  return (
    <ul>
      <li><Link href="/derive/effect">Derived list kept in sync by an effect</Link></li>
      <li><Link href="/derive/calculated">Derived list calculated during render</Link></li>
      <li><Link href="/cart/single">Cart: one context</Link></li>
      <li><Link href="/cart/split">Cart: split contexts</Link></li>
      <li><Link href="/cart/store">Cart: external store with selectors</Link></li>
      <li><Link href="/product/p1">Disclosure around a Server Component</Link></li>
    </ul>
  );
}
