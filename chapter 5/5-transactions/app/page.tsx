import Link from "next/link";
import { setDemo } from "./demo";

export default function Home() {
  return (
    <main>
      <h1>5: Transactional workflows</h1>
      <ul>
        <li><Link href="/login">Sign in as a demo user</Link> (Bob has socks in his cart)</li>
        <li><Link href="/product/p1">Review form: transaction + unique constraint</Link></li>
        <li><Link href="/checkout">Checkout: reserve, charge, confirm</Link></li>
      </ul>
      <form action={setDemo} className="muted">
        <label>
          Payment provider:{" "}
          <select name="pay" defaultValue="approve">
            <option value="approve">approves</option>
            <option value="decline">declines</option>
            <option value="timeout">times out (charge actually succeeds)</option>
          </select>
        </label>{" "}
        <label>
          <input type="checkbox" name="failBetweenWrites" /> fail between the review insert and the rating update
        </label>{" "}
        <button type="submit">Set</button>
      </form>
      <p>Then run <code>npm run scenarios</code> for the scripted double-submit and failure runs.</p>
    </main>
  );
}
