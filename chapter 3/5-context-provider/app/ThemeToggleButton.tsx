// app/ThemeToggleButton.tsx
//
// This is the one thing that actually reads the theme, so this is the
// one file that needs its own "use client", per the ordinary Leaf
// Client Component pattern. That is a deliberate boundary this file
// draws for itself, not a side effect of ThemeProvider wrapping the
// page.
"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}>
      Switch to {theme === "light" ? "dark" : "light"}
    </button>
  );
}
