import { sendError } from "./lib/send-error";

// Both versions have this listener: it reports uncaught browser errors and
// the hydration mismatches React recovers from.
window.addEventListener("error", (e) => {
  sendError({ source: "client", error: e.error ?? e.message });
});
window.addEventListener("unhandledrejection", (e) => {
  sendError({ source: "client", error: e.reason });
});
