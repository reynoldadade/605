// npm run attack (with `npm start` running in another terminal)
//
// Calls this app's Server Actions directly with fetch, the way anyone can
// after copying a request out of the Network tab. No browser, no UI, no
// Delete button. Action IDs are read from the build output here only for
// convenience; an attacker reads them from the page's own requests.
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const BASE = process.env.BASE ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actionId = (name: string, page: string) =>
  Object.entries<any>(manifest).find(([, v]) => v.exportedName === name && v.workers[page])![0];

const sqlite = new Database("dev.db");
const reviewExists = (id: string) => !!sqlite.prepare(`SELECT 1 FROM "Review" WHERE id = ?`).get(id);
const restoreAliceReview = () => {
  if (!reviewExists("r_alice"))
    sqlite.prepare(`INSERT INTO "Review" (id, productId, authorId, rating, text, createdAt) VALUES ('r_alice','p1','u_alice',5,'Light, grippy, and comfortable from the first run.', ?)`).run(Date.now());
};

// Call an action the way a Client Component does: POST to a page URL,
// a Next-Action header naming the action, the arguments as JSON.
async function callAction(page: string, id: string, args: unknown[], cookie = "") {
  const res = await fetch(BASE + page, {
    method: "POST",
    headers: {
      "Next-Action": id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
      Cookie: cookie,
    },
    body: JSON.stringify(args),
  });
  const body = await res.text();
  // The action's return value is the RSC row whose payload is not the page tree.
  const row = body.split("\n").find((l) => /^1:/.test(l)) ?? body.split("\n").find((l) => l.includes("status")) ?? "";
  return { status: res.status, result: row.replace(/^1:/, "") };
}

// Sign in as Bob through the real signIn action (a form submission).
async function signInAs(userId: string) {
  const form = new FormData();
  form.set("$ACTION_ID_" + actionId("signIn", "app/login/page"), "");
  form.set("userId", userId);
  const res = await fetch(BASE + "/login", { method: "POST", body: form, redirect: "manual", headers: { Origin: BASE } });
  const setCookie = res.headers.get("set-cookie") ?? "";
  return setCookie.split(";")[0];
}

const bob = await signInAs("u_bob");
const alice = await signInAs("u_alice");
console.log("Signed in as Bob, cookie:", bob.slice(0, 30) + "...\n");

restoreAliceReview();
console.log("1. UNGUARDED deleteReview('r_alice'), sent with Bob's cookie");
let r = await callAction("/unguarded/p1", actionId("deleteReview", "app/unguarded/[id]/page"), ["r_alice"], bob);
console.log(`   HTTP ${r.status}; Alice's review still exists? ${reviewExists("r_alice")}\n`);

restoreAliceReview();
console.log("2. GUARDED deleteReview('r_alice'), no cookie at all");
r = await callAction("/product/p1", actionId("deleteReview", "app/product/[id]/page"), ["r_alice"]);
console.log(`   HTTP ${r.status}; returned ${r.result}; still exists? ${reviewExists("r_alice")}\n`);

console.log("3. GUARDED deleteReview('r_alice'), sent with Bob's cookie");
r = await callAction("/product/p1", actionId("deleteReview", "app/product/[id]/page"), ["r_alice"], bob);
console.log(`   HTTP ${r.status}; returned ${r.result}; still exists? ${reviewExists("r_alice")}\n`);

console.log("4. GUARDED deleteReview('does-not-exist'), Bob's cookie (same answer as 3: nothing to probe)");
r = await callAction("/product/p1", actionId("deleteReview", "app/product/[id]/page"), ["does-not-exist"], bob);
console.log(`   HTTP ${r.status}; returned ${r.result}\n`);

console.log("5. GUARDED deleteReview('r_alice'), Alice's own cookie");
r = await callAction("/product/p1", actionId("deleteReview", "app/product/[id]/page"), ["r_alice"], alice);
console.log(`   HTTP ${r.status}; returned ${r.result}; still exists? ${reviewExists("r_alice")}\n`);
restoreAliceReview();

console.log("6. GUARDED submitReview for p2, which Bob never bought, with the bound productId edited by hand");
// Copy the form's hidden fields out of the page Bob is shown, exactly as
// the browser would submit them, then edit the bound productId.
const pageHtml = await (await fetch(BASE + "/product/p1", { headers: { Cookie: bob } })).text();
const form = new FormData();
for (const [, name, value = ""] of pageHtml.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) {
  form.set(name, value.replaceAll("&quot;", '"'));
}
const boundField = [...form.keys()].find((k) => /^\$ACTION_\d+:1$/.test(k))!;
console.log(`   bound args as served: ${form.get(boundField)}`);
form.set(boundField, String(form.get(boundField)).replace('"p1"', '"p2"'));
console.log(`   bound args as sent:   ${form.get(boundField)}`);
form.set("rating", "5");
form.set("text", "Great socks, never bought them though.");
const html = await (await fetch(BASE + "/product/p1", { method: "POST", body: form, headers: { Origin: BASE, Cookie: bob } })).text();
console.log("   page re-rendered with:", html.match(/Only customers who bought this product can review it\.|Thanks, your review is live\./)?.[0], "\n");

console.log("7. submitReviewLeaky: never used by any page, but exported from a module a page imports");
r = await callAction("/unguarded/p1", actionId("submitReviewLeaky", "app/unguarded/[id]/page"), ["p2", 3, "Leaky return value demo"], bob);
console.log(`   HTTP ${r.status}; returned ${r.result.slice(0, 220)}\n`);

console.log("8. Cross-site request: valid action ID, Alice's own cookie (as a malicious page would send it), Origin: https://evil.example");
const xs = await fetch(BASE + "/product/p1", {
  method: "POST",
  headers: { "Next-Action": actionId("deleteReview", "app/product/[id]/page"), "Content-Type": "text/plain;charset=UTF-8", Origin: "https://evil.example", Cookie: alice },
  body: JSON.stringify(["r_alice"]),
});
console.log(`   HTTP ${xs.status}; Alice's review still exists? ${reviewExists("r_alice")}`);

// reset for the next run
sqlite.prepare(`DELETE FROM "Review" WHERE id <> 'r_alice'`).run();
restoreAliceReview();

console.log("\n9. proxy.ts on /account: no cookie, then a forged cookie");
const noCookie = await fetch(BASE + "/account", { redirect: "manual" });
console.log(`   no cookie:     HTTP ${noCookie.status} -> ${noCookie.headers.get("location")}`);
const forged = await fetch(BASE + "/account", { redirect: "manual", headers: { Cookie: "session=forged" } });
const forgedHtml = await forged.text();
console.log(`   forged cookie: HTTP ${forged.status}, page says: ${forgedHtml.match(/Your session is invalid\. Please sign in again\.|Signed in as \w+/)?.[0]}`);
