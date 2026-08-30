// lib/mock-data.ts
//
// Stand-in for a real analytics API, same shape as the other worked
// examples in this chapter: a plain async function with an artificial
// delay, shared by both the /before and /after routes so the two are
// otherwise apples-to-apples.

export type Region = "all" | "na" | "eu" | "apac";
export type Row = { id: string; label: string; value: number };
export type SeriesPoint = { date: string; value: number };

const DELAY_MS = 300;

function delay<T>(value: T, ms = DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const LABELS = [
  "Checkout",
  "Search",
  "Onboarding",
  "Pricing page",
  "Docs",
  "Support",
  "Billing",
  "API",
  "Mobile app",
  "Marketing site",
];

const MULTIPLIER: Record<Region, number> = { all: 1, na: 0.5, eu: 0.3, apac: 0.2 };

export async function getAnalytics(
  region: Region
): Promise<{ rows: Row[]; series: SeriesPoint[] }> {
  const m = MULTIPLIER[region];

  const rows: Row[] = LABELS.map((label, i) => ({
    id: `row-${i}`,
    label,
    value: Math.round((500 + i * 47) * m),
  }));

  const series: SeriesPoint[] = Array.from({ length: 14 }).map((_, i) => ({
    date: new Date(Date.now() - (14 - i) * 864e5).toISOString().slice(5, 10),
    value: Math.round((200 + Math.sin(i / 2) * 80 + i * 6) * m),
  }));

  return delay({ rows, series });
}
