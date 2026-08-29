// app/RevenueChart.tsx
//
// recharts is browser-only, so this leaf legitimately needs
// "use client" — but the boundary stops here. It does not drag the
// stat cards, the orders table, or the date picker along with it, and
// none of THEIR dependencies (date-fns, lucide-react) end up in this
// component's bundle either.
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenuePoint = { date: string; revenue: number };

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" />
      </LineChart>
    </ResponsiveContainer>
  );
}
