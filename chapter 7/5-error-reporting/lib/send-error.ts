import { serialize } from "./serialize";

// Browser side: one beacon per error, with the route and the release.
export function sendError(report: { source: string; error: unknown; digest?: string }) {
  navigator.sendBeacon("/api/errors", JSON.stringify({
    source: report.source,
    error: serialize(report.error),
    digest: report.digest,
    path: location.pathname,
  }));
}
