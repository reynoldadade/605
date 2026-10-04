// npm run scenarios (with `npm start` running, after `npm run setup`)
//
// Submits forms the way a browser without JavaScript would, so two
// submissions can be fired at exactly the same moment: the double-click
// a disabled button can't always prevent, or a script sending twice.
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const BASE = process.env.BASE ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actionId = (name: string, page: string) =>
  Object.entries<any>(manifest).find(([, v]) => v.exportedName === name && v.workers[page])![0];
const sqlite = new Database("dev.db");
const q = (sql: string, ...args: unknown[]) => sqlite.prepare(sql).all(...args) as any[];
const run = (sql: string, ...args: unknown[]) => sqlite.prepare(sql).run(...args);

async function signInAs(userId: string) {
  const form = new FormData();
  form.set("$ACTION_ID_" + actionId("signIn", "app/login/page"), "");
  form.set("userId", userId);
  const res = await fetch(BASE + "/login", { method: "POST", body: form, redirect: "manual", headers: { Origin: BASE } });
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

// Load a page, copy its form's hidden fields (action ID, bound args).
async function formFrom(path: string, cookie: string, fields: Record<string, string> = {}) {
  const html = await (await fetch(BASE + path, { headers: { Cookie: cookie } })).text();
  const form = new FormData();
  for (const [, name, value = ""] of html.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g))
    form.set(name, value.replaceAll("&quot;", '"'));
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}
async function submit(path: string, form: FormData, cookie: string) {
  const res = await fetch(BASE + path, { method: "POST", body: form, redirect: "manual", headers: { Origin: BASE, Cookie: cookie } });
  const body = await res.text();
  const message = body.match(/You&#x27;ve already reviewed this product\.|You've already reviewed this product\.|Thanks, your review is live\.|[^>"]*out of stock\.|Your payment was declined\. You have not been charged\./)?.[0]?.replace("&#x27;", "'");
  return `HTTP ${res.status}${res.headers.get("location") ? " -> " + res.headers.get("location") : ""}${message ? ` "${message}"` : ""}`;
}
const orderStatus = async (location: string, cookie: string) =>
  (await (await fetch(BASE + location, { headers: { Cookie: cookie } })).text()).match(/We're confirming your payment|We&#x27;re confirming your payment|Paid: \$[\d.]+|Cancelled/)?.[0]?.replace("&#x27;", "'");

const bob = await signInAs("u_bob");
const alice = await signInAs("u_alice");

console.log("A. Review double-submit: two identical submissions from Bob, at the same moment");
for (const gap of [0, 200]) {
  run(`DELETE FROM "Review" WHERE authorId='u_bob'`);
  const c = bob + `; demo-check-gap-ms=${gap}`;
  console.log(`   -- with ${gap}ms between the application check and the write --`);
  const form = await formFrom("/product/p1", bob, { rating: "4", text: "Solid shoe, runs a little small." });
  const results = await Promise.all([submit("/product/p1", form, c), submit("/product/p1", form, c)]);
  results.forEach((r, i) => console.log(`   request ${i + 1}: ${r}`));
  console.log(`   Bob's reviews of p1 in the database: ${q(`SELECT COUNT(*) n FROM "Review" WHERE productId='p1' AND authorId='u_bob'`)[0].n}`);
  console.log(`   p1 summary: ${JSON.stringify(q(`SELECT ratingAverage, ratingCount FROM "Product" WHERE id='p1'`)[0])}`);
}
console.log("   (server log says which layer stopped each duplicate)\n");

console.log("B. Failure between the two writes (Alice reviewing p2, crash after the insert)");
{
  const before = q(`SELECT ratingAverage, ratingCount FROM "Product" WHERE id='p2'`)[0];
  const form = await formFrom("/product/p2", alice, { rating: "5", text: "Warm, soft, and they survived the dryer." });
  const r = await submit("/product/p2", form, alice + "; demo-fail-between-writes=1");
  console.log(`   ${r}  (thrown error -> error boundary)`);
  console.log(`   Alice's reviews of p2: ${q(`SELECT COUNT(*) n FROM "Review" WHERE productId='p2'`)[0].n}; p2 summary before ${JSON.stringify(before)}, after ${JSON.stringify(q(`SELECT ratingAverage, ratingCount FROM "Product" WHERE id='p2'`)[0])}`);
  const r2 = await submit("/product/p2", await formFrom("/product/p2", alice, { rating: "5", text: "Warm, soft, and they survived the dryer." }), alice);
  console.log(`   same review, no crash: ${r2}; p2 summary now ${JSON.stringify(q(`SELECT ratingAverage, ratingCount FROM "Product" WHERE id='p2'`)[0])}\n`);
}

const resetCheckout = () => {
  run(`DELETE FROM "OrderItem" WHERE orderId NOT LIKE 'o_seed%'`);
  run(`DELETE FROM "Order" WHERE id NOT LIKE 'o_seed%'`);
  run(`DELETE FROM "Outbox"`);
  run(`UPDATE "Product" SET stock = 1 WHERE id = 'p2'`);
  run(`INSERT OR REPLACE INTO "CartItem" (userId, productId, quantity) VALUES ('u_bob', 'p2', 1)`);
};
const orders = () => q(`SELECT status, total FROM "Order" WHERE userId='u_bob' AND id NOT LIKE 'o_seed%'`);
const stock = () => q(`SELECT stock FROM "Product" WHERE id='p2'`)[0].stock;

console.log("C. Checkout double-submit: same attempt key, two requests at once (socks, stock 1)");
{
  resetCheckout();
  const form = await formFrom("/checkout", bob);
  const results = await Promise.all([submit("/checkout", form, bob), submit("/checkout", form, bob)]);
  results.forEach((r, i) => console.log(`   request ${i + 1}: ${r}`));
  console.log(`   Bob's orders: ${JSON.stringify(orders())}; socks stock: ${stock()}\n`);
}

console.log("D. Checkout again with the socks back in the cart, but none left in stock");
{
  run(`INSERT OR REPLACE INTO "CartItem" (userId, productId, quantity) VALUES ('u_bob', 'p2', 1)`);
  console.log(`   ${await submit("/checkout", await formFrom("/checkout", bob), bob)}`);
  console.log(`   Bob's orders: ${JSON.stringify(orders())}; socks stock: ${stock()}\n`);
}

console.log("E. Payment declined: compensation releases the reservation");
{
  resetCheckout();
  const c = bob + "; demo-pay=decline";
  console.log(`   ${await submit("/checkout", await formFrom("/checkout", c), c)}`);
  console.log(`   Bob's orders: ${JSON.stringify(orders())}; socks stock: ${stock()}\n`);
}

console.log("F. Payment times out (the charge actually went through)");
{
  resetCheckout();
  const c = bob + "; demo-pay=timeout";
  const r = await submit("/checkout", await formFrom("/checkout", c), c);
  const location = r.match(/-> (\S+)/)![1];
  console.log(`   ${r}`);
  console.log(`   order page right away: "${await orderStatus(location, bob)}"; db: ${JSON.stringify(orders())}`);
  await new Promise((res) => setTimeout(res, 2500));
  console.log(`   2.5s later, after the webhook: "${await orderStatus(location, bob)}"; db: ${JSON.stringify(orders())}`);
  console.log(`   outbox rows waiting to send: ${q(`SELECT COUNT(*) n FROM "Outbox" WHERE sentAt IS NULL`)[0].n}; Bob's cart items: ${q(`SELECT COUNT(*) n FROM "CartItem" WHERE userId='u_bob'`)[0].n}`);
}
