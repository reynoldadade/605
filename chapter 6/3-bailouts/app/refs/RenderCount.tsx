"use client";

import { useRef, useState } from "react";

// Reads and writes ref.current during render. The compiler can see this,
// so it skips the component and leaves it exactly as written.
export function RenderCount() {
  const [n, setN] = useState(0);
  const renders = useRef(0);
  renders.current++;
  return (
    <section>
      <p>Rendered {renders.current} times</p>
      <button onClick={() => setN(n + 1)}>Re-render</button>
    </section>
  );
}
