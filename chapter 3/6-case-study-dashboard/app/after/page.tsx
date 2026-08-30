// app/after/page.tsx
//
// The redesign. This route itself stays a Server Component: it fetches
// directly with `await`, no client loading state needed, and renders
// most of the page as plain server-rendered markup. Only two files in
// this folder are "use client" — RegionFilter.tsx and
// AnalyticsChart.tsx — and both are Leaf Client Components, marked at
// exactly the file that needs the browser.
import RegionFilter from "./RegionFilter";
import SummaryStats from "./SummaryStats";
import AnalyticsChart from "./AnalyticsChart";
import TableShell from "./TableShell";
import DataRows from "./DataRows";
import { getAnalytics, type Region } from "../../lib/mock-data";

export default async function AfterPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: Region }>;
}) {
  const params = await searchParams;
  const region = params.region ?? "all";
  const { rows, series } = await getAnalytics(region);

  return (
    <div className="dashboard">
      <header>
        <h1>Analytics (after)</h1>
        <RegionFilter value={region} />
      </header>

      <section className="stat-cards">
        <SummaryStats rows={rows} />
      </section>

      <section className="chart">
        <AnalyticsChart data={series} />
      </section>

      <TableShell>
        <DataRows rows={rows} />
      </TableShell>
    </div>
  );
}
