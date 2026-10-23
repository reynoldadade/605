"use client";

import { useEffect, useState } from "react";

// Synchronizing derived state in an effect: two renders per change.
export function FullName({ first, last }: { first: string; last: string }) {
  const [full, setFull] = useState("");
  useEffect(() => {
    setFull(`${first} ${last}`);
  }, [first, last]);
  return <p>{full}</p>;
}
