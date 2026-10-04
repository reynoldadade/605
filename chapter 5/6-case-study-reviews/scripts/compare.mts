// npm run compare (with `npm start` running, after `npm run setup`)
//
// Sends the same five submissions to /before/p1 and /after/p1 with plain
// fetch, the way a script (or an edited request) would, and reports what
// ended up in the database each time.
//
// /before's form is a Server Component form, so it is posted like a
// browser without JavaScript posts it. /after's form action is a client
// wrapper around the Server Action (section 7's ReviewComposer), so it is
// called the way the browser's JavaScript calls it: a Next-Action header,
// the arguments in field "0" (bound productId first), the form fields
// prefixed "_1_". Both are copied from what the browser actually sends.
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const BASE = process.env.BASE ?? "http://localhost:3000";
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actionId = (name: string, page: string) =>
  Object.entries<any>(manifest).find(([, v]) => v.exportedName === name && v.workers[page])![0];
const sqlite = new Database("dev.db");
const reviewsOfP1 = () =>
  sqlite.prepare(`SELECT COALESCE(u.name, '(none)') author, r.rating FROM "Review" r LEFT JOIN "User" u ON u.id = r.authorId WHERE r.productId = 'p1' AND r.id <> 'r_alice'`).all() as { author: string; rating: number }[];
const reset = () => {
  sqlite.prepare(`DELETE FROM "Review" WHERE id <> 'r_alice'`).run();
  sqlite.prepare(`UPDATE "Product" SET ratingAverage = 5, ratingCount = 1 WHERE id = 'p1'`).run();
};

async function signInAs(userId: string) {
  const form = new FormData();
  form.set("$ACTION_ID_" + actionId("signIn", "app/login/page"), "");
  form.set("userId", userId);
  const res = await fetch(BASE + "/login", { method: "POST", body: form, redirect: "manual", headers: { Origin: BASE } });
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function formFrom(path: string, cookie: string, fields: Record<string, string>) {
  const html = await (await fetch(BASE + path, { headers: { Cookie: cookie } })).text();
  const form = new FormData();
  for (const [, name, value = ""] of html.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g))
    form.set(name, value.replaceAll("&quot;", '"'));
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

async function submit(path: string, form: FormData, cookie: string, nextAction?: string) {
  const headers: Record<string, string> = { Origin: BASE, Cookie: cookie };
  if (nextAction) Object.assign(headers, {
    "Next-Action": nextAction,
    Accept: "text/x-component",
    // The router state the browser sends with every action call, so the
    // server knows which tree to re-render after updateTag.
    "Next-Router-State-Tree": encodeURIComponent(JSON.stringify(
      ["", { children: ["after", { children: [["id", "p1", "d", null], { children: ["__PAGE__", {}, null, null] }, null, null] }, null, null] }, null, null],
    )),
  });
  const res = await fetch(BASE + path, { method: "POST", body: form, redirect: "manual", headers });
  const html = (await res.text()).replaceAll("&#x27;", "'");
  const said = html.match(/Sign in to post a review\.|Only customers who bought this product can review it\.|Please fix the highlighted fields\.|You've already reviewed this product\.|Thanks, your review is live\./)?.[0];
  // Judge by what the action said, not only the status: a fetch-style call
  // from Node occasionally gets a 500 *after* the action has already
  // returned its result (the server logs "Unexpected end of form" for the
  // trailing multipart boundary). Browsers don't hit this.
  if (said) return `"${said}"`;
  return res.status === 500 ? "HTTP 500 (error page)" : `HTTP ${res.status}`;
}

const bob = await signInAs("u_bob");
const ada = await signInAs("u_admin");

const scenarios: { name: string; cookie: string; fields: Record<string, string>; twice?: boolean }[] = [
  { name: "Signed out, form edited to say authorId=u_bob", cookie: "", fields: { authorId: "u_bob", rating: "1", text: "Terrible, do not buy. (not really Bob)" } },
  { name: "Ada (admin), never bought p1", cookie: ada, fields: { rating: "1", text: "Never tried these but one star anyway." } },
  { name: "Bob, rating 47 and text \"ok\"", cookie: bob, fields: { rating: "47", text: "ok" } },
  { name: "Bob, valid review, submitted twice at once", cookie: bob, fields: { rating: "4", text: "Solid shoe, runs a little small." }, twice: true },
  { name: "Bob, valid review, once", cookie: bob, fields: { rating: "4", text: "Solid shoe, runs a little small." } },
];

for (const s of scenarios) {
  console.log(`\n${s.name}`);
  for (const version of ["before", "after"] as const) {
    reset();
    const path = `/${version}/p1`;
    let form: FormData, nextAction: string | undefined;
    if (version === "before") {
      form = await formFrom(path, s.cookie, s.fields);
    } else {
      form = new FormData();
      for (const [k, v] of Object.entries(s.fields)) form.set(`_1_${k}`, v);
      // Field "0" last, in the same order the browser sends it.
      form.set("0", JSON.stringify(["p1", { status: "idle" }, "$K1"]));
      nextAction = actionId("submitReview", "app/after/[id]/page");
    }
    const results = s.twice
      ? await Promise.all([submit(path, form, s.cookie, nextAction), submit(path, form, s.cookie, nextAction)])
      : [await submit(path, form, s.cookie, nextAction)];
    console.log(`  ${version.padEnd(6)} responses: ${results.join(" | ")}`);
    console.log(`  ${"".padEnd(6)} saved: ${JSON.stringify(reviewsOfP1())}`);
  }
}
reset();
