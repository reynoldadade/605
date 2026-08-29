// app/page.tsx
//
// The route entry itself is a trivial Server Component — it's
// Dashboard.tsx one file down that draws the boundary in the wrong
// place. This file only exists so the anti-pattern lives in the same
// realistic shape a real app would have (a page that renders a
// feature component), rather than inlining everything into page.tsx.
import Dashboard from "./Dashboard";

export default function Page() {
  return <Dashboard />;
}
