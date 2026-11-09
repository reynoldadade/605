import { sendError } from "./lib/send-error";

// Path 2: errors that reach the browser's global error handling: event
// handlers, unhandled promise rejections, render errors no boundary of ours
// caught, and hydration mismatches React recovered from.
window.addEventListener("error", (e) => {
  sendError({ source: "client", error: e.error ?? e.message });
});
window.addEventListener("unhandledrejection", (e) => {
  sendError({ source: "client", error: e.reason });
});
