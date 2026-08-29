// app/Dashboard.tsx
//
// ANTI-PATTERN: the client boundary is drawn at the very top of the
// tree. Only the <select> in the header actually needs an event
// handler — but because "use client" is declared in THIS file, the
// entire subtree below it (stat cards, chart, table, and every import
// they touch) is compiled and shipped as client JavaScript, whether or
// not it has any interactive behavior at all.
//
// Run `npm run build` and look at the "First Load JS" for this route,
// then compare it to ../2-good-boundary's build output for the same
// page.
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"; // ~90kB gzipped, browser-only charting lib
import { format } from "date-fns"; // pulled in just to format one column in a table
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
  ShoppingCart,
} from "lucide-react"; // icon set, purely decorative here

type Order = { id: string; customer: string; total: number; placedAt: string };
type RevenuePoint = { date: string; revenue: number };
type Stats = { revenue: number; orders: number; customers: number };
type Range = "7d" | "30d" | "90d";

export default function Dashboard() {
  // Because this component is a Client Component, it can no longer
  // `await` data directly during render. The data has to be re-fetched
  // from the browser, and only AFTER the JS bundle has downloaded,
  // been parsed/compiled, and hydrated. This is the client-side fetch
  // waterfall the chapter's Hydration Costs section warns about:
  // bytes -> parse/compile -> hydrate -> only now does the network
  // request even start. Open the Network tab and watch these three
  // requests fire only after the page is already interactive.
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/dashboard/stats?range=${range}`).then((r) => r.json()),
      fetch(`/api/dashboard/orders?range=${range}`).then((r) => r.json()),
      fetch(`/api/dashboard/revenue?range=${range}`).then((r) => r.json()),
    ]).then(([s, o, r]) => {
      setStats(s);
      setOrders(o);
      setRevenue(r);
      setLoading(false);
    });
  }, [range]);

  if (loading || !stats) return <DashboardSkeleton />;

  return (
    <div className="dashboard">
      <header>
        <h1>Overview (bad boundary)</h1>
        {/* This is the ONE piece that genuinely needs interactivity. */}
        <select value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </header>

      {/* Three cards that render static numbers. Nothing here needs
          the browser, yet lucide-react ships to the client purely so
          three arrow/user/cart glyphs can be drawn. */}
      <section className="stat-cards">
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign size={18} />} trend="up" />
        <StatCard label="Orders" value={stats.orders} icon={<ShoppingCart size={18} />} trend="up" />
        <StatCard label="Customers" value={stats.customers} icon={<Users size={18} />} trend="down" />
      </section>

      {/* recharts requires the DOM, so SOME client boundary is
          legitimate around the chart — but it did not need to be
          drawn all the way up here. Compare 2-good-boundary/app/RevenueChart.tsx. */}
      <section className="chart">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenue}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* A plain table. No interactivity, no state, no event handlers —
          date-fns is imported solely to format one column below. */}
      <table className="orders-table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Placed</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer}</td>
              <td>${o.total.toFixed(2)}</td>
              <td>{format(new Date(o.placedAt), "MMM d, yyyy")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend: "up" | "down";
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
      <TrendIcon className={`stat-card__trend stat-card__trend--${trend}`} size={18} />
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="dashboard dashboard--loading">Loading…</div>;
}
