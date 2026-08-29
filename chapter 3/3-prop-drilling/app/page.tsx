import Link from "next/link";

export default function Index() {
  return (
    <div>
      <h1>Sign 2: the long, unused prop list</h1>
      <p>
        Two routes, same feature, same data. <code>/before</code> puts
        {" "}<code>&quot;use client&quot;</code> one level too high and
        <code>ProfileHeader</code> pays for it with a prop list it never
        reads from. <code>/after</code> pushes the directive down to the
        one component that actually needs it.
      </p>
      <nav className="index">
        <Link href="/before">/before — the boundary is too high</Link>
        <Link href="/after">/after — the boundary is on the leaf</Link>
      </nav>
    </div>
  );
}
