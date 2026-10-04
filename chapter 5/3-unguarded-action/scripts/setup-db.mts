// npm run setup: create dev.db from prisma/schema.sql, then seed it
// through Prisma itself so every value is stored the way Prisma expects.
import { readFileSync, rmSync } from "node:fs";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

rmSync("dev.db", { force: true });
const raw = new Database("dev.db");
raw.exec(readFileSync("prisma/schema.sql", "utf8"));
raw.close();

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./dev.db" }),
});

await db.user.createMany({
  data: [
    { id: "u_alice", name: "Alice", email: "alice@example.com" },
    { id: "u_bob", name: "Bob", email: "bob@example.com" },
    { id: "u_admin", name: "Ada (admin)", email: "ada@example.com", role: "admin" },
  ],
});

await db.product.createMany({
  data: [
    { id: "p1", name: "Trail Running Shoe", price: 12900, stock: 5 },
    { id: "p2", name: "Merino Running Socks", price: 1900, stock: 1 },
  ],
});

// Alice and Bob have both bought the shoe; only Alice bought the socks.
await db.order.create({
  data: {
    id: "o_seed_alice", userId: "u_alice", status: "paid", total: 14800,
    idempotencyKey: "seed-alice",
    items: { create: [
      { productId: "p1", quantity: 1, price: 12900 },
      { productId: "p2", quantity: 1, price: 1900 },
    ] },
  },
});
await db.order.create({
  data: {
    id: "o_seed_bob", userId: "u_bob", status: "paid", total: 12900,
    idempotencyKey: "seed-bob",
    items: { create: [{ productId: "p1", quantity: 1, price: 12900 }] },
  },
});

await db.review.create({
  data: { id: "r_alice", productId: "p1", authorId: "u_alice", rating: 5,
          text: "Light, grippy, and comfortable from the first run." },
});
await db.product.update({
  where: { id: "p1" },
  data: { ratingAverage: 5, ratingCount: 1 },
});

// Bob has the socks in his cart, for the checkout demo in example 5.
await db.cartItem.create({ data: { userId: "u_bob", productId: "p2", quantity: 1 } });

await db.$disconnect();
console.log("dev.db created and seeded");
