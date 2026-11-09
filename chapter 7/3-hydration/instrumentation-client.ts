// Runs after the HTML has loaded and before React starts hydrating.
performance.mark("hydration-start");

// Collects what reaches the browser's global error handling, including the
// recoverable errors React reports for hydration mismatches. A real app
// sends these to its error reporting (see example 5); this one keeps them
// on window so the measurement script can read them.
const w = window as unknown as { __ERRORS__: string[] };
w.__ERRORS__ = [];
window.addEventListener("error", (e) => {
  w.__ERRORS__.push(String(e.error?.message ?? e.message).slice(0, 300));
});
