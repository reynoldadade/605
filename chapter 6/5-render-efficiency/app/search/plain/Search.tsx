"use client";

import { useState } from "react";
import { Results } from "../Results";

// Every keystroke renders the results synchronously, before the browser
// can paint the character that was typed.
export function Search() {
  const [query, setQuery] = useState("");
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <Results query={query} />
    </>
  );
}
