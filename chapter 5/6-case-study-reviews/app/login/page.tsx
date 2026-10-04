import { signIn, signOut } from "./actions";

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <form action={signIn}>
        <select name="userId" defaultValue="u_bob">
          <option value="u_alice">Alice (customer, bought p1 and p2)</option>
          <option value="u_bob">Bob (customer, bought p1)</option>
          <option value="u_admin">Ada (admin)</option>
        </select>
        <button type="submit">Sign in</button>
      </form>
      <form action={signOut}><button type="submit">Sign out</button></form>
    </main>
  );
}
