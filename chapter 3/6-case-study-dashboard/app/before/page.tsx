// app/before/page.tsx
//
// ANTI-PATTERN, same shape as ../../1-bad-boundary but for an
// analytics dashboard instead of an e-commerce one. "use client" sits
// at the top of the whole route because the region filter needs local
// state. Everything else, the summary stats, most of the chart, and
// all of the data table, comes along for the ride whether it needed to
// or not, and the data itself arrives after hydration instead of
// before it.
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"; // browser-only charting lib — a legitimate leaf dependency
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table"; // a real data-grid library, reached for out of habit
import { getAnalytics, type Region, type Row, type SeriesPoint } from "../../lib/mock-data";

const columnHelper = createColumnHelper<Row>();
const columns = [
  columnHelper.accessor("label", { header: "Page" }),
  columnHelper.accessor("value", { header: "Views" }),
];

export default function BeforePage() {
  // Because this whole route is a Client Component, it can no longer
  // `await` data directly during render — the data has to be fetched
  // client-side, after the JS has downloaded, parsed, and hydrated.
  const [region, setRegion] = useState<Region>("all");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [series, setSeries] = useState<SeriesPoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalytics(region).then((data) => {
      if (!cancelled) {
        setRows(data.rows);
        setSeries(data.series);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [region]);

  const table = useReactTable({
    data: rows ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!rows || !series) return <p className="dashboard">Loading…</p>;

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="dashboard">
      <header>
        <h1>Analytics (before)</h1>
        {/* This is the ONE piece that genuinely needs interactivity. */}
        <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
          <option value="all">All regions</option>
          <option value="na">North America</option>
          <option value="eu">Europe</option>
          <option value="apac">Asia-Pacific</option>
        </select>
      </header>

      {/* A static number. Nothing here needs the browser. */}
      <section className="stat-cards">
        <div className="stat-card">
          <p className="stat-card__label">Total views</p>
          <p className="stat-card__value">{total.toLocaleString()}</p>
        </div>
      </section>

      {/* recharts requires the DOM, so some client boundary here is
          legitimate — but it did not need to be drawn all the way up
          at the top of the route. */}
      <section className="chart">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={series}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4f46e5" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* A plain table, rendered through a data-grid library's row
          model even though nothing about rendering these rows needs
          the browser — see ../after/DataRows.tsx for the same table
          with no library at all. */}
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
