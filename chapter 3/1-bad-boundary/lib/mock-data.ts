// lib/mock-data.ts
//
// Stand-in for a real database/API. The artificial delay is deliberate:
// it's large enough (400ms) that the difference between fetching this
// on the server (good-boundary) vs. re-fetching it from the browser
// after hydration (bad-boundary) is actually visible in the Network
// tab, not just theoretical.

export type Range = "7d" | "30d" | "90d";
export type Order = { id: string; customer: string; total: number; placedAt: string };
export type RevenuePoint = { date: string; revenue: number };
export type Stats = { revenue: number; orders: number; customers: number };

const DELAY_MS = 400;

function delay<T>(value: T, ms = DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const POINTS_BY_RANGE: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

export async function getDashboardStats(range: Range): Promise<Stats> {
  return delay({
    revenue: range === "7d" ? 18420 : range === "30d" ? 84210 : 251300,
    orders: range === "7d" ? 64 : range === "30d" ? 312 : 987,
    customers: range === "7d" ? 41 : range === "30d" ? 205 : 640,
  });
}

const CUSTOMERS = ["Amara Chen", "Jonas Weber", "Priya Nair", "Leo Fischer", "Sofia Rossi"];

export async function getOrders(range: Range): Promise<Order[]> {
  const count = range === "7d" ? 5 : range === "30d" ? 8 : 10;
  const orders: Order[] = Array.from({ length: count }).map((_, i) => ({
    id: `ORD-${1000 + i}`,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    total: 24.5 + i * 13.75,
    placedAt: new Date(Date.now() - i * 36e5 * 6).toISOString(),
  }));
  return delay(orders);
}

export async function getRevenue(range: Range): Promise<RevenuePoint[]> {
  const n = POINTS_BY_RANGE[range];
  const points: RevenuePoint[] = Array.from({ length: n }).map((_, i) => ({
    date: new Date(Date.now() - (n - i) * 864e5).toISOString().slice(5, 10),
    revenue: Math.round(1200 + Math.sin(i / 3) * 400 + i * 25),
  }));
  return delay(points);
}
