// app/DateRangePicker.tsx
//
// The entire reason a client boundary exists on this page lives in
// this one small file. It has no dependency on recharts, date-fns, or
// any of the icon set — its client bundle is just this component plus
// React's own runtime.
"use client";

import { useRouter, usePathname } from "next/navigation";

type Range = "7d" | "30d" | "90d";

export default function DateRangePicker({ value }: { value: Range }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`${pathname}?range=${e.target.value}`)}
    >
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
    </select>
  );
}
