// app/page.tsx
//
// A Server Component, no directive, doing a real server-only fetch
// with `await`, even though ThemeProvider (a Client Component) sits
// above it in the tree via layout.tsx. Nothing about that wrapping
// changes what this file is or how it runs.
import { getPosts } from "../lib/mock-data";
import ThemeToggleButton from "./ThemeToggleButton";

export default async function Page() {
  const posts = await getPosts();

  return (
    <div>
      <p>
        This whole page is wrapped in a Client Component
        (<code>ThemeProvider</code>, via <code>layout.tsx</code>), and it
        is still a Server Component doing a real <code>await</code> fetch
        below. Only <code>ThemeToggleButton</code> is its own client
        leaf.
      </p>
      <ThemeToggleButton />
      <ul>
        {posts.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </div>
  );
}
