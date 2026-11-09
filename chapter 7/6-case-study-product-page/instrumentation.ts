import type { Instrumentation } from "next";

// Server errors. The "before" version of the case study shipped without
// server-side reporting, so this records only the "after" routes.
export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!request.path.startsWith("/after/")) return;
  const { record } = await import("./lib/record");
  const { serialize } = await import("./lib/serialize");
  await record("errors.ndjson", {
    source: "server", error: serialize(err),
    digest: (err as { digest?: string }).digest,
    path: request.path, routeType: context.routeType,
  });
};
