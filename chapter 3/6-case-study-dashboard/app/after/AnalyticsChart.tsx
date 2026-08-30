// app/after/AnalyticsChart.tsx
//
// recharts is browser-only, so this leaf legitimately needs
// "use client" — but the boundary stops here. It does not drag
// SummaryStats or DataRows along with it, and neither of THEIR
// dependencies (there are none) ends up in this component's bundle.
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SeriesPoint } from "../../lib/mock-data";

export default function AnalyticsChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#4f46e5" />
      </LineChart>
    </ResponsiveContainer>
  );
}
