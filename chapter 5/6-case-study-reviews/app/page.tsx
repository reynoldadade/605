import Link from "next/link";
import { cookies } from "next/headers";

async function setRecs(formData: FormData) {
  "use server";
  (await cookies()).set("demo-recs-down", formData.get("down") ? "1" : "0");
}

export default function Home() {
  return (
    <main>
      <h1>6: Case Study, review submission</h1>
      <ul>
        <li><Link href="/login">Sign in as a demo user</Link></li>
        <li><Link href="/before/p1">Before</Link></li>
        <li><Link href="/after/p1">After</Link></li>
      </ul>
      <form action={setRecs} className="muted">
        <label><input type="checkbox" name="down" /> recommendations service is down</label>{" "}
        <button type="submit">Set</button>
      </form>
      <p>Run <code>npm run compare</code> to send the same requests to both versions.</p>
    </main>
  );
}
