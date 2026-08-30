// app/after/SummaryStats.tsx
//
// A pure function of its props: no server-only I/O, no client-only
// API. Shared, in this chapter's vocabulary, even though this file
// carries no directive and happens to sit in a Server Component's
// route folder.
import type { Row } from "../../lib/mock-data";

export default function SummaryStats({ rows }: { rows: Row[] }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <div className="stat-card">
      <p className="stat-card__label">Total views</p>
      <p className="stat-card__value">{total.toLocaleString()}</p>
    </div>
  );
}
