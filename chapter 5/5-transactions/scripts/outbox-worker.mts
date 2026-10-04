// npm run outbox: the background worker that drains the outbox table.
// If "sending" fails, the row stays unsent and is retried next pass.
import Database from "better-sqlite3";

const sqlite = new Database("dev.db");
const rows = sqlite.prepare(`SELECT id, type, payload FROM "Outbox" WHERE sentAt IS NULL ORDER BY createdAt`).all() as { id: string; type: string; payload: string }[];
for (const row of rows) {
  console.log(`sending ${row.type} ${row.payload}`); // an email API call in a real app
  sqlite.prepare(`UPDATE "Outbox" SET sentAt = ? WHERE id = ?`).run(Date.now(), row.id);
}
console.log(`${rows.length} message(s) sent`);
