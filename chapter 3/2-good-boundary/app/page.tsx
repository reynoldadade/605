// app/page.tsx
//
// Next.js hands page-level searchParams to the route entry as a
// Promise; this file's only job is to await it and hand a plain object
// down to Dashboard, which does the actual work as a Server Component.
import Dashboard from "./Dashboard";

type Range = "7d" | "30d" | "90d";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ range?: Range }>;
}) {
  const params = await searchParams;
  return <Dashboard searchParams={params} />;
}
