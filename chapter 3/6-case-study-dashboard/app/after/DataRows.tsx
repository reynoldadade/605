// app/after/DataRows.tsx
//
// The data-grid library from ../before/page.tsx is gone entirely.
// Rendering rows into a plain <table> never needed a library in the
// first place — only the "show all rows" toggle around it (see
// TableShell.tsx) needed the browser, and that toggle is a separate,
// much smaller file.
import type { Row } from "../../lib/mock-data";

export default function DataRows({ rows }: { rows: Row[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Page</th>
          <th>Views</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.label}</td>
            <td>{row.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
