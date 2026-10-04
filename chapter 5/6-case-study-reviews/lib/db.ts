import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

// One client per server process. In development, Next.js re-evaluates
// modules on every edit, so the client is parked on globalThis to avoid
// opening a new connection each time.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db =
  globalForDb.db ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }),
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
