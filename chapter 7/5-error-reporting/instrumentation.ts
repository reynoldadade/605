import type { Instrumentation } from "next";

// Path 1: errors on the server (rendering, Route Handlers, Server Actions,
// proxy). Next.js calls this for each; await the work.
export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { record } = await import("./lib/record");
  const { serialize } = await import("./lib/serialize");
  await record("errors.ndjson", {
    source: "server",
    error: serialize(err),
    digest: (err as { digest?: string }).digest,
    path: request.path,
    route: context.routePath,
    routeType: context.routeType,
  });
};
