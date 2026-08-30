// app/after/RegionFilter.tsx
//
// The entire reason a client boundary exists on this route lives in
// this one small file. It has no dependency on recharts or any
// data-grid library — its client bundle is just this component plus
// React's own runtime. Changing the region triggers a server
// navigation (a new `region` search param, refetched on the server),
// not a client-side refetch.
"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Region } from "../../lib/mock-data";

export default function RegionFilter({ value }: { value: Region }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`${pathname}?region=${e.target.value}`)}
    >
      <option value="all">All regions</option>
      <option value="na">North America</option>
      <option value="eu">Europe</option>
      <option value="apac">Asia-Pacific</option>
    </select>
  );
}
