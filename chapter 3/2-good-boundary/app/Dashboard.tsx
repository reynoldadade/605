// app/Dashboard.tsx
//
// The "Leaf Client Component" pattern applied: the dashboard itself
// stays a Server Component. It fetches data directly with `await`, no
// client JS ships for the parts of the page that are pure
// presentation, and only the two leaves that truly need the browser —
// <DateRangePicker> and <RevenueChart> — cross the boundary. Everything
// else (icons, date formatting, table markup) stays on the server and
// never reaches the client bundle at all.
//
// Run `npm run build` and compare this route's "First Load JS" to
// ../1-bad-boundary's build output for the same page.

import {
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"; // resolved & rendered to HTML on the server — zero bytes shipped to the client
import { format } from "date-fns"; // also server-only now
import DateRangePicker from "./DateRangePicker";
import RevenueChart from "./RevenueChart";
import { getDashboardStats, getOrders, getRevenue, type Range } from "../lib/mock-data";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { range?: Range };
}) {
  const range = searchParams.range ?? "30d";

  // Fetched directly on the server — no waterfall, no client loading
  // state needed for these three requests; they resolve before any
  // HTML (or JS) is sent to the browser.
  const [stats, orders, revenue] = await Promise.all([
    getDashboardStats(range),
    getOrders(range),
    getRevenue(range),
  ]);

  return (
    <div className="dashboard">
      <header>
        <h1>Overview (good boundary)</h1>
        {/* Leaf Client Component: this <select> is the only thing on
            the page that needs an event handler, so it — and only it —
            is "use client". Changing the range triggers a server
            navigation (see DateRangePicker.tsx), not a client refetch. */}
        <DateRangePicker value={range} />
      </header>

      <section className="stat-cards">
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign size={18} />} trend="up" />
        <StatCard label="Orders" value={stats.orders} icon={<ShoppingCart size={18} />} trend="up" />
        <StatCard label="Customers" value={stats.customers} icon={<Users size={18} />} trend="down" />
      </section>

      {/* recharts genuinely needs the DOM to render and to handle
          hover/tooltip interaction, so a client boundary here is
          legitimate — but it is drawn around ONLY the chart, not the
          page that contains it. */}
      <section className="chart">
        <RevenueChart data={revenue} />
      </section>

      {/* Plain server-rendered markup. No "use client" anywhere in this
          file, so date-fns and lucide-react never enter the client
          bundle at all. */}
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
