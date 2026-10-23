import { useState } from "react";

// Custom hooks are compiled too.
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return { on, toggle };
}
