import Link from "next/link";

export default function Home() {
  return (
    <ul>
      <li><Link href="/search/plain">Search 5,000 products: plain</Link></li>
      <li><Link href="/search/deferred">Search 5,000 products: useDeferredValue</Link></li>
      <li><Link href="/search/bounded">Search: deferred, at most 48 results shown</Link></li>
      <li><Link href="/tabs/conditional">Tabs: conditional rendering</Link></li>
      <li><Link href="/tabs/activity">Tabs: Activity</Link></li>
      <li><Link href="/stock/dependency">Stock watcher: muted as a dependency</Link></li>
      <li><Link href="/stock/effect-event">Stock watcher: useEffectEvent</Link></li>
    </ul>
  );
}
