// app/page.tsx
//
// Plain landing page linking to the two routes this case study
// compares. Not part of the chapter's before/after comparison itself.
export default function Home() {
  return (
    <nav className="landing">
      <h1>Case study: dashboard redesign</h1>
      <p>
        <a href="/before">/before</a>
        <a href="/after">/after</a>
      </p>
      <p>Run <code>npm run build</code> and compare the First Load JS for each route.</p>
    </nav>
  );
}
