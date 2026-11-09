"use client";

import { useState } from "react";

function Exploding(): React.ReactNode {
  throw new Error("size chart failed to render");
}

// A render error in a Client Component, after the page has hydrated.
export function CrashButton() {
  const [crash, setCrash] = useState(false);
  return (
    <>
      <button onClick={() => setCrash(true)}>Show size chart</button>
      {crash && <Exploding />}
    </>
  );
}
